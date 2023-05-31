/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DisplayOptions, PCD, PCDPackage, SerializedPCD } from '@pcd/pcd-types'
import {
  PCDInitArgs,
  IdentityPCDTypeName,
  IdentityPCDClaim,
  IdentityPCDProof,
  IdentityPCDArgs,
} from './types'

import { v4 as uuidv4 } from 'uuid'
//@ts-ignore
import { groth16 } from 'snarkjs'
//@ts-ignore
import * as snarkjs from 'snarkjs'

import { splitToWords } from './utils'
import { IdentityPCDCardBody } from './CardBody'
export class IdentityPCD implements PCD<IdentityPCDClaim, IdentityPCDProof> {
  type = IdentityPCDTypeName
  claim: IdentityPCDClaim
  proof: IdentityPCDProof
  id: string

  public constructor(
    id: string,
    claim: IdentityPCDClaim,
    proof: IdentityPCDProof
  ) {
    this.id = id
    this.claim = claim
    this.proof = proof
  }
}

// initial function
let initArgs: PCDInitArgs | undefined = undefined
export async function init(args: PCDInitArgs): Promise<void> {
  initArgs = args
}



async function zkProof(pcdArgs: IdentityPCDArgs): Promise<IdentityPCDProof> {
  const input = {
    sign: splitToWords(pcdArgs.signature as bigint, 32n, 64n),
    exp: splitToWords(BigInt(65337), BigInt(32), BigInt(64)),
    modulus: splitToWords(BigInt(pcdArgs.mod), BigInt(32), BigInt(64)),
    hashed: splitToWords(pcdArgs.message as bigint, 32n, 5n),
  }

  const { proof } = await groth16.fullProve(
    input,
    initArgs?.wasmURL,
    initArgs?.zkeyURL
  )

  return {
    exp: pcdArgs.exp,
    mod: pcdArgs.mod,
    proof,
  }
}

export async function prove(args: IdentityPCDArgs): Promise<IdentityPCD> {
  if (!initArgs) {
    throw new Error(
      'cannot make semaphore signature proof: init has not been called yet'
    )
  }

  const id = uuidv4()
  const pcdClaim: IdentityPCDClaim = {
    exp: args.exp,
    mod: args.mod,
  }
  const pcdProof = await zkProof(args)

  return new IdentityPCD(id, pcdClaim, pcdProof)
}

function getVerifyKey() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const verifyKey = require('../artifacts/verification_key.json')
  return verifyKey
}
export async function verify(pcd: IdentityPCD): Promise<boolean> {
  const vk = getVerifyKey()
  return snarkjs.groth16.verify(
    vk,
    [
      ...splitToWords(BigInt(65337), BigInt(32), BigInt(64)),
      ...splitToWords(BigInt(pcd.proof.mod), BigInt(32), BigInt(64)),
    ],
    pcd.proof.proof
  )
}

export function serialize(
  pcd: IdentityPCD
): Promise<SerializedPCD<IdentityPCD>> {
  return Promise.resolve({
    type: IdentityPCDTypeName,
    pcd: JSON.stringify({
      type: pcd.type,
      id: pcd.id,
      claim: pcd.claim,
    }),
  } as SerializedPCD<IdentityPCD>)
}

export function deserialize(serialized: string): Promise<IdentityPCD> {
  return JSON.parse(serialized)
}

export function getDisplayOptions(pcd: IdentityPCD): DisplayOptions {
  return {
    header: 'ZK Signature',
    displayName: 'pcd-' + pcd.type,
  }
}

export const IdentityPCDPackage: PCDPackage<
  IdentityPCDClaim,
  IdentityPCDProof,
  IdentityPCDArgs
> = {
  name: IdentityPCDTypeName,
  renderCardBody: IdentityPCDCardBody,
  getDisplayOptions,
  prove,
  verify,
  serialize,
  deserialize,
}
