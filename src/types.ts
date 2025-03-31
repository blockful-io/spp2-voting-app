export type SnapshotVote = {
  id: string;
  voter: string;
  vp: number;
  choice: { [key: number]: number };
};

export type SnapshotGrant = {
  choiceId: number;
  grantId: number;
  voteCount: number;
  voteStatus: boolean;
  voteSamples: SnapshotVote[];
  currentVotes: number;
};

export type SnapshotProposal = {
  id: string;
  title: string;
  space: { id: string };
  choices: string[];
  scores: number[];
  scoresState: string;
  scoresTotal: number;
  votes?: SnapshotVote[];
  votesAvailable?: number | null;
  currentVote?: SnapshotVote | null;
  grants: SnapshotGrant[];
};