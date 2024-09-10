import { AccountAddress } from "@aptos-labs/ts-sdk";
import { TokenMerkleTreeLeaf } from "./utils/reward-trees/token-tree";
import { EarnerMerkleTreeLeaf } from "./utils/reward-trees/earner-tree";
import MerkleTree from "merkletreejs";
import { keccak256 } from "ethers";
import { combineUint8Arrays } from "./utils/uint8-array";

async function main() {
  const tokenLeaf = new TokenMerkleTreeLeaf({
    token: AccountAddress.fromString('0x77a9c4bfab03138f55c387b47e80a9a34c3b9c220204dc56cf25da2eacde1be9'),
    cummulativeEarnings: BigInt(1000)
  });

  console.log('token leaf hash: ', tokenLeaf.hash());

  const tokenTreeDepth = 2;
  const tokenTreeSize = 1 << tokenTreeDepth;
  const tokenIndex = 2;

  const tokenLeaves: TokenMerkleTreeLeaf[] = [];
  for (let i = 0; i < tokenTreeSize; i++) {
    if (i !== tokenIndex) {
      tokenLeaves.push(new TokenMerkleTreeLeaf({
        token: AccountAddress.fromString('0xcafe' + i),
        cummulativeEarnings: BigInt(1000 + i)
      }));
    } else {
      tokenLeaves.push(tokenLeaf);
    }
  }

  const tokenLeafHashes = tokenLeaves.map(leaf => Buffer.from(leaf.hash()));
  const tokenTree = new MerkleTree(tokenLeafHashes, keccak256);
  const tokenRoot = new Uint8Array(tokenTree.getRoot());
  console.log('token root: ', tokenRoot);

  const tokenProof = tokenTree.getProof(tokenLeafHashes[tokenIndex], tokenIndex)
  const tokenProofData: Uint8Array = combineUint8Arrays(...tokenProof.map(p => new Uint8Array(p.data)))
  console.log(tokenProofData);


  const earnerLeaf = new EarnerMerkleTreeLeaf({
    earner: AccountAddress.fromString('0x34162865fa'),
    tokenTreeRoot: tokenRoot
  })

  console.log('earner leaf hash: ', earnerLeaf.hash());

  const earnerTreeDepth = 3;
  const earnerTreeSize = 1 << earnerTreeDepth;
  const earnerIndex = 3;
  const earnerLeaves: EarnerMerkleTreeLeaf[] = [];
  for(let i = 0; i < earnerTreeSize; i++){
    if(i !== earnerIndex){
      let tokenTreeRoot = new Uint8Array(32);
      tokenTreeRoot[0] = i;
      tokenTreeRoot[1] = i + 1;
      earnerLeaves.push(new EarnerMerkleTreeLeaf({
        earner: AccountAddress.fromString('0xfaca' + i),
        tokenTreeRoot: new Uint8Array(32)
      }))
    }else {
      earnerLeaves.push(earnerLeaf);
    }
  }

  const earnerLeafHashes = earnerLeaves.map(leaf => Buffer.from(leaf.hash()));
  const earnerTree = new MerkleTree(earnerLeafHashes, keccak256);
  const earnerRoot = new Uint8Array(earnerTree.getRoot());
  console.log('earner root: ', earnerRoot);

  const earnerProof = earnerTree.getProof(earnerLeafHashes[earnerIndex], earnerIndex);
  const earnerProofData: Uint8Array = combineUint8Arrays(...earnerProof.map(p => new Uint8Array(p.data)))
  console.log(earnerProofData);
}

main();