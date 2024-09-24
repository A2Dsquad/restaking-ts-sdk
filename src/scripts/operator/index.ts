import { Account } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import { ABIRoot } from "@thalalabs/surf/build/types/types";
import OperatorManagerAbi from "src/abis/operator-manager.json";
import { aptos } from "src/configs/aptos";

export class OperatorAdapter {
  private surfClient;
  constructor(private account?: Account){
    this.surfClient = createSurfClient(aptos).useABI(OperatorManagerAbi as ABIRoot);
  }

  async operatorShares(operator: string, tokens: string[]) {
    const [shares] = await this.surfClient.view.operator_shares({
      functionArguments: [operator, tokens],
      typeArguments: [],
    })
    return shares;
  }
}