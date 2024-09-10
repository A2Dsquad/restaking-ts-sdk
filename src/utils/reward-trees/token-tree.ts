import { AccountAddress, Serializable, Serializer } from "@aptos-labs/ts-sdk"
import { getBytes, keccak256 } from "ethers";

export class TokenMerkleTreeLeaf extends Serializable {
  serialize(serializer: Serializer): void {
    serializer.serializeFixedBytes(this.token.bcsToBytes())
    serializer.serializeU64(this.cummulativeEarnings);
  }
  token: AccountAddress;
  cummulativeEarnings: bigint

  constructor({ token, cummulativeEarnings }: { token: AccountAddress, cummulativeEarnings: bigint }) {
    super();
    this.token = token;
    this.cummulativeEarnings = cummulativeEarnings;
  }

  hash(){
    return getBytes(keccak256(this.bcsToBytes()));
  }
}

