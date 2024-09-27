import { createSurfClient } from '@thalalabs/surf';
import { ABIRoot } from '@thalalabs/surf/build/types/types';
import StakingPoolAbi from 'src/abis/staking-pool.json';
import { aptos } from 'src/configs/aptos';
export class StakingPoolAdapter {
  private client;
  constructor() {
    this.client = createSurfClient(aptos).useABI(StakingPoolAbi as ABIRoot);
  }
  async totalShares(pool: string) {
    const [totalShares] = await this.client.view.total_shares({
      functionArguments: [pool],
      typeArguments: [],
    })
    return totalShares;
  }
}