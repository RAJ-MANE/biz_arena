
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

// Load environment variables *before* importing the DB
config({ path: '.env.local' });

async function seedQuestions() {
    console.log('🌱 Seeding quiz questions...');

    // Dynamically import db and schema to ensure env vars are present
    const { db } = await import('../src/db/index');
    const { questions, options } = await import('../src/db/schema');

    const questionsData = [
        {
            text: "Your MVP (Minimum Viable Product) is ready. How do you approach the launch?",
            options: [
                { text: "Viral Social Media Campaign: Focus heavily on hype and influencers.", marketing: 3, capital: 0, team: 0, strategy: 1 },
                { text: "Stealth Mode: Keep it quiet and iterate with a small group of beta testers.", marketing: 0, capital: 1, team: 1, strategy: 2 },
                { text: "Direct Sales: Hire a small sales team to knock on doors and close deals.", marketing: 1, capital: 0, team: 2, strategy: 1 },
                { text: "Paid Ads Blitz: Spend 50% of your seed capital on Google/Meta ads.", marketing: 4, capital: -1, team: 0, strategy: 1 },
            ]
        },
        {
            text: "A top-tier developer from a FAANG company wants to join, but their salary demand is double your budget.",
            options: [
                { text: "Pay the Premium: Cut marketing costs to afford them; tech is everything.", marketing: -1, capital: 0, team: 3, strategy: 2 },
                { text: "Equity Only: Offer no salary but a significantly higher percentage of the company.", marketing: 0, capital: 2, team: 2, strategy: 0 },
                { text: "Hire Two Juniors: Use the same budget to hire two eager graduates.", marketing: 0, capital: 1, team: 1, strategy: 2 },
                { text: "Pass: Wait for a candidate who fits your current financial constraints.", marketing: 0, capital: 3, team: 0, strategy: 1 },
            ]
        },
        {
            text: "An investor offers $500k but demands a 40% stake in the company.",
            options: [
                { text: "Accept Immediately: We need the \"Capital\" to survive and scale.", marketing: 1, capital: 4, team: 0, strategy: -1 },
                { text: "Negotiate: Counter-offer 20% for $250k to keep more control.", marketing: 0, capital: 2, team: 0, strategy: 2 },
                { text: "Bootstrapped Growth: Reject the offer and rely on organic revenue.", marketing: 1, capital: 0, team: 1, strategy: 2 },
                { text: "Look for \"Smart Money\": Reject it and wait for an investor with better industry connections.", marketing: 1, capital: 1, team: 0, strategy: 2 },
            ]
        },
        {
            text: "Your primary competitor just slashed their prices by 30%.",
            options: [
                { text: "Match the Price: Cut your margins to maintain your \"Marketing\" share.", marketing: 2, capital: -1, team: 0, strategy: 3 },
                { text: "Premium Pivot: Increase your price but add \"Luxury\" features.", marketing: 2, capital: 1, team: 1, strategy: 0 },
                { text: "Better Service: Keep prices the same but offer 24/7 personalized support.", marketing: 1, capital: 0, team: 2, strategy: 1 },
                { text: "Ignore Them: Trust your brand loyalty and make no changes.", marketing: 0, capital: 2, team: 0, strategy: 2 },
            ]
        },
        {
            text: "Your team is burning out after three months of \"Crunch Time.\"",
            options: [
                { text: "Team Retreat: Spend funds on a 3-day vacation to boost morale.", marketing: 0, capital: -1, team: 4, strategy: 1 },
                { text: "Performance Bonuses: Pay everyone a one-time cash bonus for their hard work.", marketing: 0, capital: -1, team: 3, strategy: 2 },
                { text: "Remote Work Policy: Allow everyone to work from home indefinitely.", marketing: 0, capital: 1, team: 2, strategy: 1 },
                { text: "Push Through: Explain that the next milestone is critical for survival.", marketing: 0, capital: 2, team: -1, strategy: 3 },
            ]
        },
        {
            text: "A major bug is found in your software 2 hours before a big pitch.",
            options: [
                { text: "Be Honest: Mention the bug to the investor and explain the fix plan.", marketing: 0, capital: 1, team: 1, strategy: 2 },
                { text: "Hard-Coded Demo: Create a \"fake\" demo that skips the buggy part.", marketing: 2, capital: 2, team: 0, strategy: 0 },
                { text: "Technical Pivot: Focus the pitch on the \"Strategy\" and team rather than the demo.", marketing: 1, capital: 1, team: 0, strategy: 2 },
                { text: "Reschedule: Risk losing the investor's interest to fix the product first.", marketing: -1, capital: 0, team: 1, strategy: 4 },
            ]
        },
        {
            text: "You have extra budget. Where do you invest it?",
            options: [
                { text: "R&D: Develop a new futuristic feature.", marketing: 0, capital: 0, team: 1, strategy: 3 },
                { text: "Brand Ambassador: Hire a famous YouTuber to promote the product.", marketing: 4, capital: 0, team: 0, strategy: 0 },
                { text: "Customer Success: Hire a manager to reduce user churn.", marketing: 1, capital: 1, team: 2, strategy: 0 },
                { text: "Emergency Fund: Keep it as \"Capital\" for a rainy day.", marketing: 0, capital: 4, team: 0, strategy: 0 },
            ]
        },
        {
            text: "A bigger company offers to \"White Label\" your tech for their brand.",
            options: [
                { text: "Say Yes: Great for \"Capital\" and steady cash flow.", marketing: -1, capital: 4, team: 0, strategy: 1 },
                { text: "Say No: We want to build our own brand, not someone else's.", marketing: 3, capital: 0, team: 0, strategy: 1 },
                { text: "Hybrid Deal: White label a limited version while keeping the best for ourselves.", marketing: 1, capital: 2, team: 0, strategy: 1 },
                { text: "Partnership: Propose a \"Powered by [Your Startup]\" co-branding.", marketing: 2, capital: 1, team: 0, strategy: 1 },
            ]
        },
        {
            text: "Negative reviews are appearing on the App Store regarding UI/UX.",
            options: [
                { text: "Public Response: Reply to every review with a personalized apology.", marketing: 3, capital: 0, team: 1, strategy: 0 },
                { text: "Rapid Redesign: Shift the whole \"Team\" to fix the UI immediately.", marketing: 1, capital: 0, team: 1, strategy: 2 },
                { text: "User Incentives: Give upset users a 1-month free subscription.", marketing: 2, capital: -1, team: 0, strategy: 3 },
                { text: "Data Analysis: Wait to see if it's a trend before making changes.", marketing: 0, capital: 2, team: 0, strategy: 2 },
            ]
        },
        {
            text: "Your Co-founder and Lead Architect have a major disagreement on the product roadmap.",
            options: [
                { text: "Founder's Way: Side with the co-founder to maintain leadership authority.", marketing: 0, capital: 0, team: -1, strategy: 3 },
                { text: "Architect's Way: Side with the tech expert to ensure the best product.", marketing: 0, capital: 0, team: 2, strategy: 2 },
                { text: "Mediation: Hire an external consultant to decide the best path.", marketing: 0, capital: -1, team: 2, strategy: 1 },
                { text: "The Compromise: Build a hybrid version that satisfies both (but takes longer).", marketing: 0, capital: 0, team: 2, strategy: -1 },
            ]
        },
        {
            text: "You have the opportunity to expand to a new city/market.",
            options: [
                { text: "Aggressive Expansion: Open three offices at once to dominate the region.", marketing: 3, capital: -2, team: 1, strategy: 2 },
                { text: "Local Partnership: Find a local distributor to handle the \"Marketing.\"", marketing: 2, capital: 1, team: 0, strategy: 1 },
                { text: "Digital Only: Expand the service online without physical presence.", marketing: 1, capital: 2, team: 0, strategy: 1 },
                { text: "Delay: Wait until the current market is 100% saturated.", marketing: 0, capital: 3, team: 0, strategy: 1 },
            ]
        },
        {
            text: "A global pandemic (or similar event) hits, and users stop using your physical service.",
            options: [
                { text: "Immediate Pivot: Launch a completely digital/virtual version within a week.", marketing: 1, capital: 0, team: 1, strategy: 2 },
                { text: "Downsize: Lay off 50% of the \"Team\" to preserve \"Capital.\"", marketing: 0, capital: 3, team: -2, strategy: 1 },
                { text: "Support Mode: Offer your current services for free to build \"Marketing\" goodwill.", marketing: 4, capital: -2, team: 1, strategy: 1 },
                { text: "Wait and Watch: Use the time for internal R&D and training.", marketing: 0, capital: 1, team: 2, strategy: 1 },
            ]
        },
        {
            text: "An influencer with 1M followers wants to promote you for free, but their image is controversial.",
            options: [
                { text: "Take the Risk: The massive \"Marketing\" reach is worth any backlash.", marketing: 4, capital: 1, team: 0, strategy: -1 },
                { text: "Decline: Our brand \"Strategy\" focuses on being professional and safe.", marketing: -1, capital: 0, team: 0, strategy: 3 },
                { text: "Limited Campaign: Do a one-off post instead of a long-term partnership.", marketing: 2, capital: 1, team: 0, strategy: 1 },
                { text: "Curated Content: Only allow them to post pre-approved, scripted content.", marketing: 1, capital: 1, team: 0, strategy: 2 },
            ]
        },
        {
            text: "Your main server provider has a massive outage during peak hours.",
            options: [
                { text: "Disaster Recovery: Move everything to a backup provider immediately (Expensive).", marketing: 1, capital: -1, team: 0, strategy: 4 },
                { text: "Communication: Spend the time tweeting and emailing users updates.", marketing: 3, capital: 1, team: 0, strategy: 0 },
                { text: "Internal Fix: Have your \"Team\" work through the night to optimize your own code.", marketing: 0, capital: 1, team: 3, strategy: 0 },
                { text: "Legal Action: Threaten the provider to get a refund or \"Capital\" credit.", marketing: 0, capital: 2, team: 0, strategy: 0 },
            ]
        },
        {
            text: "Your startup is 2 years old. What is your ultimate \"Strategy\"?",
            options: [
                { text: "Acquisition: Focus on being bought by a tech giant.", marketing: 1, capital: 3, team: 0, strategy: 0 },
                { text: "IPO: Prepare the company for a public stock market listing.", marketing: 2, capital: 0, team: 0, strategy: 2 },
                { text: "Sustainability: Focus on becoming \"Profitable\" and staying independent.", marketing: 0, capital: 2, team: 1, strategy: 1 },
                { text: "Disruption: Re-invest everything into a new, even riskier project.", marketing: 1, capital: -2, team: 2, strategy: 3 },
            ]
        }
    ];

    try {
        // 1. Clean up existing questions
        console.log('🧹 Cleaning up existing questions...');
        await db.delete(questions); // Cascades to options
        console.log('✓ Cleaned up.');

        // 2. Insert new questions
        console.log(`📝 Inserting ${questionsData.length} questions...`);

        // Process in sequence to ensure order is correct
        for (const [index, q] of questionsData.entries()) {
            const insertedQuestions = await db.insert(questions).values({
                text: q.text,
                order: index + 1,
                maxTokenPerQuestion: 4, // Default to 4
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning({ id: questions.id });

            const questionId = insertedQuestions[0].id;

            // Insert options for this question
            await db.insert(options).values(
                q.options.map((opt, optIndex) => ({
                    questionId: questionId,
                    text: opt.text,
                    order: optIndex + 1,
                    tokenDeltaMarketing: opt.marketing,
                    tokenDeltaCapital: opt.capital,
                    tokenDeltaTeam: opt.team,
                    tokenDeltaStrategy: opt.strategy,
                    createdAt: new Date(),
                }))
            );
        }

        console.log('✅ All questions seeded successfully!');

    } catch (error) {
        console.error('❌ Error seeding questions:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

seedQuestions();
