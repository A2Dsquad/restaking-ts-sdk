import { Account } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import { ABIRoot } from "@thalalabs/surf/build/types/types";
import StakerManagerABI from 'src/abis/staker-manager.json';
import WithdrawalABI from 'src/abis/withdrawal.json';
import { aptos } from "src/configs/aptos";

export class StakerAdapter {
  private stakerClient;
  private withdrawalClient;
  constructor(private account?: Account){
    this.stakerClient = createSurfClient(aptos).useABI(StakerManagerABI as ABIRoot);
    this.withdrawalClient = createSurfClient(aptos).useABI(WithdrawalABI as ABIRoot);
  }

  async stake(token: string, amount: bigint) {
    return await this.stakerClient.entry.stake_asset_entry({
      account: this.account,
      functionArguments: [token, amount.toString()],
      typeArguments: [],
    })
  }

  async delegate(operator: string) {
    return await this.stakerClient.entry.delegate({
      account: this.account,
      functionArguments: [operator],
      typeArguments: [],
    })
  }

  async undelegate() {
    return await this.withdrawalClient.entry.undelegate({
      account: this.account,
      functionArguments: [this.account!.accountAddress.toString()],
      typeArguments: [],
    })
  }

  async delegateOf(staker: string) {
    const [delegate] = await this.stakerClient.view.delegate_of({
      functionArguments: [staker],
      typeArguments: [],
    })
    return delegate;
  }

  async stakerNonnormalizedShares(staker: string) {
    const [tokens, nonnormalizedShares] = await this.stakerClient.view.staker_nonnormalized_shares({
      functionArguments: [staker],
      typeArguments: [],
    })
    return {
      tokens,
      nonnormalizedShares
    }
  }

  async withdrawalQueue(staker: string) {
    const [nonce] = await this.stakerClient.view.cummulative_withdrawals_queued({
      functionArguments: [staker],
      typeArguments: [],
    })
    return nonce;
  }
  async queueWithdrawal(tokens: string[], amounts: bigint[]) {
    const result = await this.withdrawalClient.entry.queue_withdrawal({
      functionArguments: [tokens, amounts.map(amount => amount.toString())],
      typeArguments: [],
      account: this.account,
    })
    return result;
  }

  async completeQueuedWithdrawal() {
    
  }
}