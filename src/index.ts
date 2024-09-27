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
import { StakingPoolAdapter } from './scripts/staking-pool';

const token = "0x3a97789007a67518d51c1733caef0c0a60d5db819e64d9bb5abc004f2df934a2";

const deployerPrivateKey = new Ed25519PrivateKey(process.env.DEPLOYER_PRIVATE_KEY as string);
const deployerAccount = Account.fromPrivateKey({ privateKey: deployerPrivateKey });
const stakerPrivateKey = new Ed25519PrivateKey(process.env.STAKER_PRIVATE_KEY as string);
const stakerAccount = Account.fromPrivateKey({ privateKey: stakerPrivateKey });
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
  for (let i = 0; i < earnerTreeSize; i++) {
    if (i !== earnerIndex) {
      let tokenTreeRoot = new Uint8Array(32);
      tokenTreeRoot[0] = i;
      tokenTreeRoot[1] = i + 1;
      earnerLeaves.push(new EarnerMerkleTreeLeaf({
        earner: AccountAddress.fromString('0xfaca' + i),
        tokenTreeRoot: new Uint8Array(32)
      }))
    } else {
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

async function distributeFA(stakerAddress: string) {
  const adapter = new FAAdapter(deployerAccount);
  const balance = await adapter.balance(token, deployerAddress);
  console.log(balance);
  const amount = parseUnits('1000', 8);
  const res = await adapter.transfer(token, stakerAddress, amount);
  console.log(res);
  const postBal = await adapter.balance(token, stakerAddress);
  console.log(postBal)
}

async function stake() {
  const adapter = new StakerAdapter(stakerAccount);
  // const amount = parseUnits('1000', 8);
  // const res = await adapter.stake(token, amount);
  // console.log(res);
  const stakes = await adapter.stakerNonnormalizedShares(stakerAddress);
  console.log(stakes);
}

async function operator() {
  const adapter = new OperatorAdapter();
  const shares = await adapter.operatorShares(deployerAddress, [token]);
  console.log(shares);
}

async function undelegate() {
  const stakerAdapter = new StakerAdapter(stakerAccount);
  const operatorAdapter = new OperatorAdapter(deployerAccount);
  const res = await stakerAdapter.undelegate();
  console.log(res);
  const shares = await operatorAdapter.operatorShares(deployerAddress, [token]);
  console.log(shares);
}

async function queueWithdrawal() {
  const stakerAdapter = new StakerAdapter(stakerAccount);
  const amount = parseUnits('500', 8);
  const res = await stakerAdapter.queueWithdrawal([token], [amount]) as UserTransactionResponse;
  console.log(res.events.map(e => e.data))
}

async function completeQueuedWithdrawal() {
  const amount = parseUnits('500', 8).toString();
  const event =  {
    withdrawal: {
      delegated_to: '0xa56762ce4e11553d450c1db24fdfd204176d31179e72027319bbce9dc3a1376',
      nonce: '1',
      nonnormalized_shares: [amount],
      staker: '0xe96eba4fcd8ec0f5b1ce69aca462fdbb363035d44d47b7ee4777d561b9839fb4',
      start_time: '1727421871',
      tokens: [token],
      withdrawer: '0xe96eba4fcd8ec0f5b1ce69aca462fdbb363035d44d47b7ee4777d561b9839fb4'
    },
    withdrawal_root: '25886541316756581720927653218954408642661182219431077611115408638349286015458'
  };
  const adapter = new StakerAdapter(stakerAccount);
  const result = await adapter.completeQueuedWithdrawal(
    event.withdrawal.staker,
    event.withdrawal.delegated_to,
    event.withdrawal.withdrawer,
    event.withdrawal.nonce,
    event.withdrawal.start_time,
    event.withdrawal.tokens,
    event.withdrawal.nonnormalized_shares,
  )
  console.log(result);
}

async function totalShares() {
  const adapter = new StakingPoolAdapter();
  const pool = '0x7609205655ba8dd9c6882d2a8e025e3262b244c1c9b174f2711f688c49f6a6e2'
  const data = await adapter.totalShares(pool);
  console.log(data);
}

// distributeFA('0xad7dbaad5063e2c98950711b22d52d76afc679c047ffb68717b8b3482a8993be');
operator();