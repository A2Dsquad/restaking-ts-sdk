import { AccountAddress, Serializable, Serializer } from "@aptos-labs/ts-sdk"
import { getBytes, keccak256 } from "ethers";

export class EarnerMerkleTreeLeaf extends Serializable {
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.earner.bcsToBytes())
    serializer.serializeBytes(this.tokenTreeRoot);
  }
  earner: AccountAddress;
  tokenTreeRoot: Uint8Array

  constructor({ earner, tokenTreeRoot }: { earner: AccountAddress, tokenTreeRoot: Uint8Array }) {
    super();
    this.earner = earner;
    this.tokenTreeRoot = tokenTreeRoot;
  }

  hash(){
    return getBytes(keccak256(this.bcsToBytes()));
  }
}

