import {
  useAccount,
  useDisconnect,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import bg from "../assets/bg.jpg";
import { Button } from "../components/button";
import { useEffect, useState } from "react";
import SupportedWallets from "../components/supportedWallets";
import { MIGRATOR_ADDRESS } from "../assets/addresses";
import MIGRATOR_ABI from "../assets/migratorAbi.json";
import ERC20_ABI from "../assets/erc20Abi.json";
import { formatEther, parseEther } from "viem";

function Homepage() {
  const [isConnectModal, setIsConnectModal] = useState(false);
  const [decimalPrecision, setDecimalPrecision] = useState(0);
  const [destination, setDestination] = useState(null);
  const [migrationRate, setMigrationRate] = useState(0);
  const [source, setSource] = useState(null);
  const [amount, setAmount] = useState(0);
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();

  const shortenAddress = address
    ? `${address?.slice(0, 4)}...${address?.slice(-5)}`
    : null;

  const onConnect = () => {
    if (isConnected) disconnect();
    else {
      setIsConnectModal(true);
    }
  };

  useEffect(() => {
    const getDecimalPrecision = async () => {
      try {
        const decimalPrecision = await publicClient.readContract({
          abi: MIGRATOR_ABI,
          address: MIGRATOR_ADDRESS,
          functionName: "DECIMAL_PRECISION",
        });
        const converted = formatEther(decimalPrecision);
        setDecimalPrecision(converted);
      } catch (err) {
        console.error(err);
      }
    };

    const getDestination = async () => {
      try {
        const destination = await publicClient.readContract({
          abi: MIGRATOR_ABI,
          address: MIGRATOR_ADDRESS,
          functionName: "destination",
        });
        setDestination(destination);
      } catch (err) {
        console.error(err);
      }
    };

    const getMigrationRate = async () => {
      try {
        const migrationRate = await publicClient.readContract({
          abi: MIGRATOR_ABI,
          address: MIGRATOR_ADDRESS,
          functionName: "migrationRate",
        });
        const converted = formatEther(migrationRate);
        setMigrationRate(converted);
      } catch (err) {
        console.error(err);
      }
    };

    const getSource = async () => {
      try {
        const source = await publicClient.readContract({
          abi: MIGRATOR_ABI,
          address: MIGRATOR_ADDRESS,
          functionName: "source",
        });
        setSource(source);
      } catch (err) {
        console.error(err);
      }
    };

    getDecimalPrecision();
    getDestination();
    getMigrationRate();
    getSource();
  }, [address, publicClient]);

  const handleMigrate = async () => {
    try {
      if (source && amount > 0) {
        const allowance = await publicClient.readContract({
          abi: ERC20_ABI,
          address: source,
          functionName: "allowance",
          args: [address, MIGRATOR_ADDRESS],
        });

        if (allowance < amount) {
          const approveHash = await walletClient.writeContract({
            abi: ERC20_ABI,
            address: source,
            functionName: "approve",
            args: [MIGRATOR_ADDRESS, parseEther(amount.toString())],
          });

          await publicClient.waitForTransactionReceipt({
            approveHash,
            confirmations: 2,
          });
        }

        const hash = await walletClient.writeContract({
          abi: MIGRATOR_ABI,
          address: MIGRATOR_ADDRESS,
          functionName: "migrate",
          args: [parseEther(amount.toString())],
        });
        await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });

        return;
      }
    } catch (err) {
      console.log("Error migrating token(s)", err);
    }
  };

  return (
    <>
      <SupportedWallets
        isOpen={isConnectModal}
        onClose={() => setIsConnectModal(false)}
      />
      <div
        className="bg-cover bg-center h-[100vh] w-full flex justify-around items-center flex-col"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="w-full h-full">
          <div className="flex justify-around items-center w-full h-full border-red-100">
            <div className="flex flex-col">
              <h3 className="text-white text-center mb-2">Connect Wallet</h3>
              <Button onClick={onConnect}>
                {shortenAddress || "Connect Wallet"}
              </Button>
            </div>
            <div className="flex flex-col">
              <input
                type="number"
                step="any"
                placeholder="enter amount"
                onChange={(e) => {
                  setAmount(e.target.value);
                }}
                className="mb-2 h-[35px] rounded bg-transparent text-white pl-2 outline-none border border-white"
              />
              <Button onClick={handleMigrate}>Migrate</Button>
            </div>
            <div className="flex flex-col">
              <h3 className="text-white text-center mb-2">Connect Wallet</h3>
              <Button>Connect</Button>
            </div>
          </div>
        </div>
        <div className="w-full h-[100px] flex justify-center items-center flex-col">
          <p className="text-white">{decimalPrecision}</p>
          <p className="text-white">{destination}</p>
          <p className="text-white">{migrationRate}</p>
          <p className="text-white">{source}</p>
        </div>
      </div>
    </>
  );
}

export default Homepage;
