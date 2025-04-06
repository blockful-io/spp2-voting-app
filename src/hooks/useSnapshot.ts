import snapshot from "@snapshot-labs/snapshot.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Web3Provider } from "@ethersproject/providers";

const PROPOSAL_ID =
  "0x4a3a3c8e453e296b4c96ea1e889ab0eb99c3bc19769ec091fc97a3586146c04e";

export function useVoteOnProposal() {
  const queryClient = useQueryClient();

  const client = new snapshot.Client712("https://hub.snapshot.org");
  const web3 =
    typeof window !== "undefined" ? new Web3Provider(window.ethereum!) : null;

  const {
    mutateAsync: voteFunc,
    error,
    isPending,
  } = useMutation({
    mutationFn: voteOnProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["snapshot-score"] });
    },
  });

  async function voteOnProposal(choice: number[]) {
    if (!web3) {
      throw new Error("Web3 provider not available");
    }
    const [account] = await web3.listAccounts();
    await client.vote(web3, account, {
      space: "pikonha.eth",
      proposal: PROPOSAL_ID,
      type: "ranked-choice",
      choice,
    });
  }

  return {
    voteFunc,
    error,
    isPending,
  };
}
