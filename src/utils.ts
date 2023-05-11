import axios from "axios";
import { SnarkJSProof, Proof } from "./types";

import path from "path";
import fs from "fs";

export function extractSignatureFromPDF() {}

export function splitToWordsWithName(
  value: bigint,
  wordSize: bigint,
  wordCount: bigint,
  name: string
) {
  let t = value;
  const words: { [key: string]: string } = {};
  for (let i = BigInt(0); i < wordCount; ++i) {
    const baseTwo: bigint = 2n;
    const key = `${name}[${i.toString()}]`;
    words[key] = `${t % baseTwo ** wordSize}`;
    t = BigInt(t / 2n ** wordSize);
  }
  if (!(t == BigInt(0))) {
    throw `Number ${value} does not fit in ${(
      wordSize * wordCount
    ).toString()} bits`;
  }
  return words;
}

/**
 * Packs a proof into a format compatible with Semaphore.
 * @param originalProof The proof generated with SnarkJS.
 * @returns The proof compatible with Semaphore.
 */
export function packProof(originalProof: SnarkJSProof): Proof {
  return [
    originalProof.pi_a[0],
    originalProof.pi_a[1],
    originalProof.pi_b[0][1],
    originalProof.pi_b[0][0],
    originalProof.pi_b[1][1],
    originalProof.pi_b[1][0],
    originalProof.pi_c[0],
    originalProof.pi_c[1],
  ];
}

/**
 * Unpacks a proof into its original form.
 * @param proof The proof compatible with Semaphore.
 * @returns The proof compatible with SnarkJS.
 */
export function unpackProof(proof: Proof): SnarkJSProof {
  return {
    pi_a: [proof[0], proof[1]],
    pi_b: [
      [proof[3], proof[2]],
      [proof[5], proof[4]],
    ],
    pi_c: [proof[6], proof[7]],
    protocol: "groth16",
    curve: "bn128",
  };
}

function getFileName(urlFile: string): string {
  return urlFile.split("/").pop() as string;
}

export async function downloadFile(url: string): Promise<boolean> {
  const META_PATH = __dirname + "/meta";
  let fileName = getFileName(url);
  console.log(path.join(META_PATH, fileName));
  if (fs.existsSync(path.join(META_PATH, fileName))) return false;

  const writer = fs.createWriteStream(path.join(META_PATH, fileName));

  const res = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  res.data.pipe(writer);
  return true;  
  
}
