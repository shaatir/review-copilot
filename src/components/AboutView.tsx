import { Container, Flashbar, KeyValuePairs, PageHeader } from "@/components/console";

export function AboutView() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="About"
        description="Review Copilot is a human-in-the-loop triage agent for blockchain brand-protection detections. It drafts a decision. It never executes one."
      />

      <Flashbar type="warning">
        Dry-run is a hard invariant. There is no auto-approve, no auto-block, and no write
        to any registrar, wallet, or ChainPatrol list.
      </Flashbar>

      <Container header="What this is">
        <p className="text-[13px] leading-6 text-ink">
          A portfolio demo for the gap between detection and blocklist: an analyst
          force-multiplier that clusters lookalikes, scores evidence, and waits for a
          human. It is not a ChainPatrol rebuild, not a browser-extension blocker, and
          not a live WHOIS or screenshot pipeline.
        </p>
        <KeyValuePairs
          columns={2}
          items={[
            { label: "Queue", value: "42 synthetic detections across three brands" },
            { label: "Campaigns", value: "Shared-drain / kit / airdrop clusters" },
            { label: "Evidence", value: "IOCs, signals, draft, dry-run human call" },
            { label: "Eval", value: "Precision / recall versus golden labels" },
          ]}
        />
      </Container>

      <Container header="Decision vocabulary">
        <div className="overflow-x-auto">
          <table className="console-table">
            <thead>
              <tr>
                <th>Draft</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-bold">APPROVE</td>
                <td>Recommend adding the asset to a blocklist (malicious)</td>
              </tr>
              <tr>
                <td className="font-bold">REJECT</td>
                <td>Recommend dismissing the detection (false positive / official)</td>
              </tr>
              <tr>
                <td className="font-bold">WATCHLIST</td>
                <td>Hold — mixed or incomplete evidence</td>
              </tr>
              <tr>
                <td className="font-bold">Dry-run</td>
                <td>The draft is advisory. A human remains the decision-maker</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Container>

      <Container header="Ethics">
        <ul className="list-disc space-y-2 pl-5 text-[13px] leading-6 text-ink">
          <li>
            Synthetic or public-looking IOCs only. No live phishing kits, no malware
            binaries, no credentialed access to anyone’s mailbox or wallet.
          </li>
          <li>No targeting of real victims and no instructions for running a campaign.</li>
          <li>
            The human remains the decision-maker. Dry-run is enforced in the draft object
            (<code className="font-mono text-[12px]">dryRun: true</code>) and in the UI.
          </li>
          <li>Optional ChainPatrol access is a status lookup, not a report.</li>
          <li>
            WHOIS, DNS, and visual similarity are stubs with realistic mock data, labeled
            as such. This repo does not scrape live phishing pages.
          </li>
        </ul>
      </Container>
    </div>
  );
}
