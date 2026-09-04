---
schedule: "0 7 * * 1"
script: |
  node -e '
  const fs=require("fs");
  const def="/workspace/agent/plugin-data/trade-front-desk/ledger.jsonl";
  const arg=process.argv.find(function(a){return typeof a==="string"&&a.endsWith(".jsonl");});
  const p=process.env.LEDGER_PATH||arg||def;
  let lines=[];
  try{lines=fs.readFileSync(p,"utf8").split(/\r?\n/).filter(Boolean);}catch(e){console.log("LEDGER_MISSING");process.exit(0);}
  const now=Date.now();
  const weekMs=7*24*3600*1000;
  const byOutcome={}; const byJob={}; const priceByJob={};
  let total=0; let n=0; let afterHoursEmerg=0; let abandonedAddr=0; let abandonedTotal=0; let spanish=0; let spam=0;
  for (const line of lines){
    let o; try{o=JSON.parse(line);}catch(e){continue;}
    const t=Date.parse(o.ts); if(!Number.isFinite(t)||(now-t)>weekMs) continue;
    n++; total+=Number(o.at_risk_usd)||0;
    byOutcome[o.outcome]=(byOutcome[o.outcome]||0)+1;
    byJob[o.job_type]=(byJob[o.job_type]||0)+1;
    if(o.asked_price===true){priceByJob[o.job_type]=(priceByJob[o.job_type]||0)+1;}
    if(o.outcome==="emergency"&&o.after_hours===true) afterHoursEmerg++;
    if(o.outcome==="abandoned"){abandonedTotal++; if(o.abandoned_step==="address"||o.abandoned_step==="city") abandonedAddr++;}
    if(o.language==="es") spanish++;
    if(o.outcome==="spam") spam++;
  }
  console.log("WEEK_ROWS", n);
  console.log("AT_RISK_USD_SUM", total);
  console.log("BY_OUTCOME", JSON.stringify(byOutcome));
  console.log("BY_JOB_TYPE", JSON.stringify(byJob));
  console.log("PRICE_QUESTIONS_BY_JOB", JSON.stringify(priceByJob));
  console.log("AFTER_HOURS_EMERGENCIES", afterHoursEmerg);
  console.log("ABANDONED_AT_ADDRESS", abandonedAddr);
  console.log("ABANDONED_TOTAL", abandonedTotal);
  console.log("SPANISH_INTAKES", spanish);
  console.log("SPAM_COUNT", spam);
  '
---

Read the numbers printed by the script (WEEK_ROWS, AT_RISK_USD_SUM, BY_OUTCOME, BY_JOB_TYPE, PRICE_QUESTIONS_BY_JOB, AFTER_HOURS_EMERGENCIES, ABANDONED_AT_ADDRESS, ABANDONED_TOTAL, SPANISH_INTAKES, SPAM_COUNT). Turn those printed numbers into one short Monday money digest for the owner. Do not recalculate totals yourself; only narrate what the script printed.

Then open additional_context/coaching-rules.md. Using only the printed numbers, pick the single recommended change those rules produce (first matching rule, or the no-change case). End the digest with exactly that one recommended change. Do not add a second suggestion.

If the script printed LEDGER_MISSING, say the ledger file was not found and stop. Send only to the owner placeholders. Do not contact callers.

The script reads LEDGER_PATH if set, or a .jsonl argument, otherwise /workspace/agent/plugin-data/trade-front-desk/ledger.jsonl.
