import React from "react";

interface VotingLayoutProps {
  header: string;
  subheader?: string;
  teamName?: string;
  teamMembers?: number;
  showRules?: boolean;
  children: React.ReactNode;
}

const VotingLayout: React.FC<VotingLayoutProps> = ({
  header,
  subheader,
  teamName,
  teamMembers,
  showRules = false,
  children,
}) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Section */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-3xl px-6 py-12">
          <div className="flex flex-col items-start gap-4">
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground ring-1 ring-border">
              {header}
            </span>
            {subheader && (
              <p className="max-w-xl text-muted-foreground">{subheader}</p>
            )}
            {teamName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold">Team:</span> {teamName}
                {teamMembers !== undefined && (
                  <span className="ml-2">({teamMembers} members)</span>
                )}
              </div>
            )}
            {showRules && (
              <div className="mt-2 rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground">
                <ul className="list-disc ml-4">
                  <li>Peer evaluation and pitch presentations</li>
                  <li>1 token from each category = 1 vote</li>
                  <li>Unlimited upvotes, max 3 downvotes</li>
                  <li>Leaders vote on behalf of team</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Main Content */}
      <section className="mx-auto max-w-3xl px-6 pb-16">
        {children}
      </section>
    </div>
  );
};

export default VotingLayout;
