#!/bin/bash

git submodule update --init --recursive

cd circom-rsa-verify 
yarn

cd circom-ecdsa 
yarn 
cd ..

cd test 

wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_20.ptau

circom circuits/rsa_verify_sha1_pkcs1v15.circom  --r1cs --wasm


npx snarkjs groth16 setup rsa_verify_sha1_pkcs1v15.r1cs powersOfTau28_hez_final_20.ptau circuit_0000.zkey

echo "test random" |npx snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey 

npx snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

cd ..

cp test/rsa_verify_sha1_pkcs1v15_js/rsa_verify_sha1_pkcs1v15.wasm ../artifacts
cp test/circuit_final.zkey ../artifacts
cp test/verification_key.json ../artifacts

