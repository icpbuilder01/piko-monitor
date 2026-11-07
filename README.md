# PIKO Monitor

A public, read-only dashboard for the [PIKO](https://www.piko.network/) ecosystem: price, mining, burn, bankrolls and the cycles left on each canister.

**Live:** https://k6tpq-iqaaa-aaaaa-qhpfq-cai.icp0.io

It has no login and no backend. The browser reads everything directly:

| Data | Source |
|---|---|
| Mining, supply, burn | `mother` canister and PIKO ledger |
| Bankrolls | PIKO ledger balances |
| Cycles and controllers | Public blackhole canister `e3mmv-5qaaa-aaaah-aadma-cai`, a co-controller of each listed canister |
| PIKO price | ICPSwap API, falling back to the on-chain pool price |
| ICP price | ICPSwap ICP/ckUSDC pool |

Hashrate is an estimate based on the current difficulty and the time between blocks. Runway uses a burn rate measured in your browser when possible, otherwise a reference reading from November 2026, and does not count future top-ups.

## Development

```
npm install
npm run dev
```

Deploy with [icp-cli](https://github.com/dfinity/icp-cli). The canister is named `lock-frontend` in `icp.yaml` because it reuses the former PikoLock site canister.

## License

MIT
