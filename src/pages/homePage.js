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
        className="bg-cover bg-center h-screen w-full flex justify-center items-center  flex-col"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="bg-white rounded-lg shadow-md pb-4">
          <h1 className="bg-blue-600 text-center py-3 text-white text-2xl font-bold rounded-tl rounded-tr">
            Migrator
          </h1>

          <h3 className="text-2xl text-center text-gray-800 mt-4">
            {shortenAddress || "Wallet not connected"}
          </h3>
          <div className="mt-6 text-center text-gray-600 px-8">
            <p>
              <span className="font-bold">Decimal Precision: </span>
              {decimalPrecision}
            </p>
            <p>
              <span className="font-bold">Destination: </span> <br />
              {destination}
            </p>
            <p>
              <span className="font-bold">Migration Rate: </span>
              {migrationRate}
            </p>
            <p>
              <span className="font-bold">Source: </span> <br />
              {source}
            </p>
          </div>
          <div className="mb-6 px-8">
            <input
              type="number"
              step="any"
              placeholder="Enter amount"
              onChange={(e) => {
                setAmount(e.target.value);
              }}
              className="w-full m-auto h-10 rounded bg-gray-200 text-gray-800 outline-none focus:ring focus:ring-blue-400 mt-2 pl-2"
            />
          </div>
          <div className="w-full px-8">
            <Button onClick={onConnect} className="w-full">
              {shortenAddress ? "Disconnect" : "Connect Wallet"}
            </Button>
          </div>
          <div className="mt-2 px-8">
            <Button
              onClick={handleMigrate}
              className="w-full mt-6"
              disabled={!shortenAddress}
            >
              Migrate
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Homepage;
