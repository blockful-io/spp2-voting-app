import { PROPOSAL_ID, PROPOSAL_SPACE } from "@/utils/config";
import { Web3Provider } from "@ethersproject/providers";
import snapshot from "@snapshot-labs/snapshot.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";

export function useVoteOnProposal() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

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
    if (!address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    const web3 = new Web3Provider(walletClient.transport);

    await client.vote(web3, address, {
      proposal: PROPOSAL_ID,
      type: "ranked-choice",
      choice,
      space: PROPOSAL_SPACE,
    });
  }

  return {
    voteFunc,
    error,
    isPending,
  };
}
