import * as dotenv from 'dotenv';
dotenv.config();
import { Account, AccountAddress, Ed25519PrivateKey, UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { TokenMerkleTreeLeaf } from "./utils/reward-trees/token-tree";
import { EarnerMerkleTreeLeaf } from "./utils/reward-trees/earner-tree";
import MerkleTree from "merkletreejs";
import { keccak256, parseUnits } from "ethers";
import { combineUint8Arrays } from "./utils/uint8-array";
import { FAAdapter } from './scripts/fungible-asset';
import { StakerAdapter } from './scripts/staker';
import { OperatorAdapter } from './scripts/operator';

const deployerPrivateKey = new Ed25519PrivateKey(process.env.DEPLOYER_PRIVATE_KEY as string);
const deployerAccount = Account.fromPrivateKey({privateKey: deployerPrivateKey});
const stakerPrivateKey = new Ed25519PrivateKey(process.env.STAKER_PRIVATE_KEY as string);
const stakerAccount = Account.fromPrivateKey({privateKey: stakerPrivateKey});
const deployerAddress = deployerAccount.accountAddress.toString();
const stakerAddress = stakerAccount.accountAddress.toString();

async function merkleTree() {
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

async function delegate() {

  const stakerAdapter = new StakerAdapter(stakerAccount);
  const deployerAdapter = new StakerAdapter(deployerAccount);
  const selfDelRes = await deployerAdapter.delegate(deployerAddress);
  console.log(selfDelRes);

  const result = await stakerAdapter.delegate(deployerAddress);
  console.log(result);

  const delegateOf = await stakerAdapter.delegateOf(stakerAddress);
  console.log(delegateOf);
}

async function distributeFA(){
  const token = "0x9425954d7391b7b9b3b5448acf34a1c205f5555424621e34676423783e767fdf";
  const adapter = new FAAdapter(deployerAccount);
  const balance = await adapter.balance(token, deployerAddress);
  console.log(balance);
  const amount = parseUnits('1000', 8);
  const res = await adapter.transfer(token, stakerAddress, amount);
  console.log(res);
  const postBal = await adapter.balance(token, stakerAddress);
  console.log(postBal)
}

async function stake(){
  const token = "0x9425954d7391b7b9b3b5448acf34a1c205f5555424621e34676423783e767fdf";
  const adapter = new StakerAdapter(stakerAccount);
  const amount = parseUnits('1000', 8);
  const res = await adapter.stake(token, amount);
  console.log(res);
  const stakes = await adapter.stakerNonnormalizedShares(stakerAddress);
  console.log(stakes);
}

async function operator(){
  const token = "0x9425954d7391b7b9b3b5448acf34a1c205f5555424621e34676423783e767fdf";
  const adapter = new OperatorAdapter();
  const shares = await adapter.operatorShares(deployerAddress, [token]);
  console.log(shares);
}

async function undelegate() {
  const token = "0x9425954d7391b7b9b3b5448acf34a1c205f5555424621e34676423783e767fdf";
  const stakerAdapter = new StakerAdapter(stakerAccount);
  const operatorAdapter = new OperatorAdapter(deployerAccount);
  const res = await stakerAdapter.undelegate();
  console.log(res);
  const shares = await operatorAdapter.operatorShares(deployerAddress, [token]);
  console.log(shares);
}

async function queueWithdrawal() {
  const token = "0x9425954d7391b7b9b3b5448acf34a1c205f5555424621e34676423783e767fdf";
  const stakerAdapter = new StakerAdapter(stakerAccount);
  const amount = parseUnits('500', 8);
  const res = await stakerAdapter.queueWithdrawal([token], [amount]) as UserTransactionResponse;  
  console.log(res.events.map(e => e.data))
}

async function completeQueuedWithdrawal() {
  const event = {
    withdrawal: {
      delegated_to: '0xa56762ce4e11553d450c1db24fdfd204176d31179e72027319bbce9dc3a1376',
      nonce: '0',
      staker: '0xe96eba4fcd8ec0f5b1ce69aca462fdbb363035d44d47b7ee4777d561b9839fb4',
      start_time: '1727174102',
      withdrawer: '0xe96eba4fcd8ec0f5b1ce69aca462fdbb363035d44d47b7ee4777d561b9839fb4'
    },
    withdrawal_root: '40076266151246870449122142493390754719435589473220808847683366137999899445569'
  };
}
queueWithdrawal();