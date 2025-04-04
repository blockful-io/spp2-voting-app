This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Using the SPP2 Voting Application

This application implements the Service Provider Program (SPP) allocation process using the Copeland voting method. Here's how to use it:

### Data Directory Structure

All data files are stored in the `src/helpers/data` directory:

- **CSV Files**:
  - `votes.csv` - Contains the votes from the Snapshot proposal
  - `service-providers.csv` - Contains service provider budget data
  - `choices.csv` - Contains the choice options for the vote
  - Sample files (`sample-*.csv`) are provided as templates

- **JSON Files**:
  - `mocked-votes.json` - Generated from votes.csv for testing
  - Allocation results are saved as `spp-allocation-[proposal-id].json`

### CSV File Formats

#### votes.csv

```csv
voter,vp,choice1,choice2,choice3,choice4,...
0x1234...,1000,Namespace,Unruggable,eth.limo,Blockful,...
```

- `voter`: Ethereum address of the voter
- `vp`: Voting power (numeric)
- `choice1, choice2, ...`: Ranked choices in order of preference

#### service-providers.csv

```csv
name,basicBudget,extendedBudget,isSpp1
Unruggable,400000,700000,true
Blockful,400000,700000,false
```

- `name`: Name of the service provider (must match names in votes)
- `basicBudget`: Basic funding request amount
- `extendedBudget`: Extended funding request amount
- `isSpp1`: Whether the provider was in SPP1 (true/false)

#### choices.csv

```csv
name
Unruggable
Blockful
Namespace
```

- `name`: Name of each choice option

### Configuration

The application can be configured in `src/helpers/config.js`:

- `USE_LOCAL_DATA`: Use local JSON data instead of Snapshot API
- `USE_CSV_DATA`: Use CSV files for service provider data
- `LOCAL_DATA_PATH`: Path to the mocked votes JSON file
- `VOTES_CSV_PATH`: Path to the votes CSV file
- `SERVICE_PROVIDERS_CSV_PATH`: Path to the service providers CSV file

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
