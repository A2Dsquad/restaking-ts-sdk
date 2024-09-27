import { Account } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import { ABIRoot } from "@thalalabs/surf/build/types/types";
import FungibleAssetAbi from "src/abis/fungible-asset.json";
import PrimaryFAStoreAbi from "src/abis/primary-fungible-store.json";
import { aptos } from "src/configs/aptos";
import { faMetdataType } from "src/constants";


export class FAAdapter {
  protected faClient;
  protected storeClient;
  constructor(private readonly account?: Account){
    this.faClient = createSurfClient(aptos).useABI(FungibleAssetAbi as ABIRoot);
    this.storeClient = createSurfClient(aptos).useABI(PrimaryFAStoreAbi as ABIRoot);
  }

  async balance(token: string, owner: string) {
    const [bal] = await this.storeClient.view.balance({
      functionArguments: [owner, token],
      typeArguments: [faMetdataType],  
    })
    return bal;
  }

  async transfer(token: string, recipient: string, amount: bigint) {
    const result = await this.storeClient.entry.transfer({
      functionArguments: [token, recipient, amount.toString()],
      typeArguments: [faMetdataType],  
      account: this.account,
    })
    return result;
  }
}