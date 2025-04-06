import { Web3Provider } from "@ethersproject/providers";
import snapshot from "@snapshot-labs/snapshot.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

const PROPOSAL_ID =
  "0x2d5d195baaa173394d77484787b7220da5ed0a2f48568e309a404eeec1d0004b";

export function useVoteOnProposal() {
  const queryClient = useQueryClient();
  const { address } = useAccount();

  const client = new snapshot.Client712("https://hub.snapshot.org");

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
    if (!address) {
      throw new Error("Wallet not connected");
    }

    const web3 = new Web3Provider(window.ethereum!);

    await client.vote(web3, address, {
      proposal: PROPOSAL_ID,
      type: "ranked-choice",
      choice,
      space: "pikonha.eth",
    });
  }

  return {
    voteFunc,
    error,
    isPending,
  };
}
