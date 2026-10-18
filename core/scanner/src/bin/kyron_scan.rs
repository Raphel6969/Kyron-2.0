//! Kyron 2.0 CLI Tool Scanner (`kyron-scan`)
//! Scans MCP tool listings, schemas, and manifests for prompt injection, secret access, and exfiltration directives.

use kyron_scanner::{ScanResult, ToolScanner};
use kyron_types::ToolState;
use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::process::exit;

#[derive(Debug, Deserialize)]
struct ToolEntry {
    name: String,
    #[serde(default)]
    description: String,
    #[serde(default, rename = "inputSchema")]
    input_schema: serde_json::Value,
    #[serde(default)]
    schema: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
struct CliOutput {
    total_tools: usize,
    clean_count: usize,
    quarantined_count: usize,
    results: Vec<ToolScanOutput>,
}

#[derive(Debug, Serialize)]
struct ToolScanOutput {
    name: String,
    scan_result: ScanResult,
}

fn print_usage() {
    println!("Kyron 2.0 Manifest Scanner");
    println!("Usage: kyron-scan [OPTIONS] <tools.json>");
    println!();
    println!("Options:");
    println!("  --json       Output machine-readable JSON");
    println!("  --strict     Fail with exit code 1 if any risk score > 0.30 (default: >= 0.60)");
    println!("  --help       Show this help message");
}

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.is_empty() || args.contains(&"--help".to_string()) || args.contains(&"-h".to_string()) {
        print_usage();
        return;
    }

    let json_output = args.contains(&"--json".to_string());
    let strict_mode = args.contains(&"--strict".to_string());

    let file_path = args.iter().find(|arg| !arg.starts_with("--"));
    let file_path = match file_path {
        Some(p) => p,
        None => {
            eprintln!("Error: No input JSON file specified.");
            print_usage();
            exit(2);
        }
    };

    let content = match fs::read_to_string(file_path) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Error reading file '{}': {}", file_path, e);
            exit(2);
        }
    };

    // Try parsing as array of tools, or object with "tools" field, or single tool object
    let tools: Vec<ToolEntry> = if let Ok(arr) = serde_json::from_str::<Vec<ToolEntry>>(&content) {
        arr
    } else if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
        if let Some(arr) = val.get("tools").and_then(|t| t.as_array()) {
            serde_json::from_value(serde_json::Value::Array(arr.clone())).unwrap_or_default()
        } else if let Ok(single) = serde_json::from_value::<ToolEntry>(val) {
            vec![single]
        } else {
            eprintln!("Error: Unrecognized JSON format. Expected tool array or MCP tools/list object.");
            exit(2);
        }
    } else {
        eprintln!("Error: Invalid JSON input.");
        exit(2);
    };

    if tools.is_empty() {
        eprintln!("Warning: No tools found in '{}'", file_path);
        exit(0);
    }

    let scanner = ToolScanner::new();
    let mut outputs = Vec::new();
    let mut quarantined = 0;
    let mut clean = 0;

    for tool in &tools {
        let schema_str = if let Some(s) = &tool.schema {
            s.to_string()
        } else {
            tool.input_schema.to_string()
        };

        let result = scanner.scan(&tool.name, &tool.description, &schema_str);
        if result.recommended_state == ToolState::Quarantined || (strict_mode && result.risk_score > 0.30) {
            quarantined += 1;
        } else {
            clean += 1;
        }

        outputs.push(ToolScanOutput {
            name: tool.name.clone(),
            scan_result: result,
        });
    }

    if json_output {
        let cli_output = CliOutput {
            total_tools: tools.len(),
            clean_count: clean,
            quarantined_count: quarantined,
            results: outputs,
        };
        println!("{}", serde_json::to_string_pretty(&cli_output).unwrap());
    } else {
        println!("================================================================================");
        println!("  KYRON 2.0 REGISTRY SCANNER — MANIFEST REPORT");
        println!("================================================================================");
        println!("Scanned {} tools in '{}':", tools.len(), file_path);
        println!();

        for out in &outputs {
            let res = &out.scan_result;
            let status_badge = if res.recommended_state == ToolState::Quarantined {
                "[QUARANTINE]"
            } else {
                "[CLEAN]"
            };

            println!(
                "  {} Tool: {:<20} Risk: {:.2} (Anomaly: {:.2}, Entropy: {:.2})",
                status_badge, out.name, res.risk_score, res.anomaly_score, res.entropy_score
            );

            if !res.risk_reasons.is_empty() {
                for r in &res.risk_reasons {
                    println!("      - {}", r);
                }
            }
            if !res.flagged_spans.is_empty() {
                println!("      Flagged Spans: {:?}", res.flagged_spans);
            }
            println!();
        }

        println!("================================================================================");
        println!(
            "Summary: {} total | {} clean | {} quarantined",
            tools.len(),
            clean,
            quarantined
        );
        println!("================================================================================");
    }

    if quarantined > 0 {
        exit(1);
    } else {
        exit(0);
    }
}
