import { describe } from "mocha"
import { IdentityPCDArgs, PCDInitArgs } from "../src/types"
import { PUBLIC_CIRCUIT_URL, PUBLIC_ZKEY_PROVE_URL, PUBLIC_ZKEY_VERIFY_URL, init, prove, verify } from "../src/pcd"
import { assert } from "chai"


describe("PCD tests", function() {
    this.timeout(0);
    it.only("PCD flow", async () => {
        let pcdInitArgs: PCDInitArgs = {
            wasmFilePath: PUBLIC_CIRCUIT_URL,
            zkeyFilePath: PUBLIC_ZKEY_PROVE_URL,
            verificationKeyFilePath: PUBLIC_ZKEY_VERIFY_URL
        }

        await init(pcdInitArgs);
        let pcdArgs: IdentityPCDArgs = {
            exp: BigInt(65337), 
            message: BigInt(""),
            mod: BigInt(""),
            signature: BigInt("")
        }

    
        let pcd = await prove(pcdArgs);
        
        let verified = await verify(pcd);
        assert(verified == true, "Should verifiable");
    })
})  