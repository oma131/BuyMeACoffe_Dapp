import useDarkMode from "../useDarkmode";
import abi from '../utils/BuyMeACoffee.json';
import { ethers } from "ethers";
import Head from 'next/head'
import Image from 'next/image'
import React, { useEffect, useState } from "react";
import styles from '../styles/Home.module.css'

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0x6d6D486d1bB489d55Cf00751c286928fb5832EaE";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  //Set Darkmode
  const [colorTheme, setTheme] = useDarkMode();

  const onNameChange = (event) => {
    setName(event.target.value);
  }

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  }

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({method: 'eth_accounts'})
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }

  const connectWallet = async () => {
    try {
      const {ethereum} = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

const buyCoffee = async (amount) => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum, 'any');
				const signer = provider.getSigner();
				const buyMeACoffee = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				console.log('buying coffee..');
				const coffeeTxn = await buyMeACoffee.buyCoffee(
					name ? name : 'anon',
					message ? message : 'Enjoy your coffee!',
					{ value: ethers.utils.parseEther(amount) }
				);

				await coffeeTxn.wait();

				console.log('mined ', coffeeTxn.hash);

				console.log('coffee purchased!');

				// Clear the form fields.
				setName('');
				setMessage('');
			}
		} catch (error) {
			console.log(error);
		}
	};

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        
        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
      
    } catch (error) {
      console.log(error);
    }
  };
  
  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name
        }
      ]);
    };

    const {ethereum} = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    }
  },);
  
  return (
    <div className="p-5 dark:bg-gray-900 bg-true-gray-50">
      <Head>
        <title>OMA Coffee Dapp</title>
        <meta name="description" content="This is a Tipping site" />
        <link rel="icon" href="/logo.svg" />
      </Head>

      <nav className="border-b border-indigo-200">
        <div className="flex items-center justify-between h-16 mx-auto max-w-screen-2xl sm:px-6 lg:px-8">
          <h1 className="flex items-center">
            <Image src="/mainlogo.svg" width={130} height={130} alt="Logo image"/>
          </h1>
      
          <div className="flex items-center justify-between">
            {colorTheme === "light" ? (
              <svg
                onClick={() => setTheme("light")}
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10  text-gray-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            ) : (
              <svg
                onClick={() => setTheme("dark")}
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-indigo-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
            {!currentAccount && (
              <button onClick={connectWallet} className="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 text-white font-bold py-2 px-4 rounded">
                Connect Wallet
              </button>
            )}
            {currentAccount && (
              <button className="bg-gray-300 text-white font-bold py-2 px-4 rounded">
                Wallet Connected &#10004;
              </button>
            )}

          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.title}>
            <span className="text-slate-900 dark:text-white">Buy OMA a Coffee &#128521;</span>
            <p className="text-xl text-blue-gray-900 dark:text-white">
                Everyone should believe in something. <br/>
                I believe I will have another coffee.
            </p>
        </h1>
        
        {currentAccount ? (
          <div className="w-full">
            <form className="max-w-md mx-auto mt-8 mb-0 space-y-4">
              <div>
                <label className="text-xl text-blue-gray-900 dark:text-white font-medium">
                  Name
                </label> <br/>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter Name"
                  onChange={onNameChange}
                  className="w-full p-4 pr-12 text-sm border-black-400 bg-gray-100 dark:bg-black text-slate-900 dark:text-white rounded-lg shadow-sm"
                  />
              </div>

              <div>
                <label className="text-xl text-blue-gray-900 dark:text-white font-medium"> 
                    Send OMA a message &#128522; 
                </label>
                <br/>

                <textarea
                  rows={3}
                  placeholder="Enjoy your coffee!"
                  id="message"
                  className="w-full p-4 pr-12 text-sm border-black-400 bg-gray-100 dark:bg-black text-slate-900 dark:text-white rounded-lg shadow-sm"
                  onChange={onMessageChange}
                  required
                >
                </textarea>
              </div>
            </form>
            <div className={styles.colors}>
                <button
                  type="button"
                  className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-bold py-2 px-4 rounded"
                  onClick={() => buyCoffee("0.001")}
                >
                  Mini Coffee <br/> <span className="text-white font-light py-2 px-4 rounded">0.001ETH</span>
                </button>
                <button
                  type="button"
                  className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-bold py-2 px-4 rounded"
                  onClick={() => buyCoffee("0.003")}
                >
                  Medium Coffee <br/> <span className="text-white font-light py-2 px-4 rounded">0.003ETH</span>
                </button>
                <button
                  type="button"
                  className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-bold py-2 px-4 rounded"
                  onClick={() => buyCoffee("0.005")}
                >
                  Mega Coffee <br/> <span className="text-white font-light py-2 px-4 rounded">0.005ETH</span>
                </button>
              </div>
          </div>
        ) : (
          <div>
              <button onClick={connectWallet} className="w-96 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 hover:bg-blue-700 text-white mt-5 font-bold py-2 px-4 rounded">
                Connect your wallet 
              </button>
              <div>
              <Image src="/useimage.svg" height={400} width={400} alt="Girl sitting with coffee"/>
            </div> 
          </div>
        )}
      </main>

      {currentAccount && (
        <h1 className="text-center text-4xl text-blue-gray-900 dark:text-white font-medium">
          Messages received
        </h1>
      )}

      <div className="grid grid-cols-4 gap-4 mt-10 w-full">
        {currentAccount && (memos.map((memo, idx) => {
            return (
            <div key={idx} className="w-64 p-1 mb-10 shadow-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded-2xl">
            <div className="block p-6 bg-white dark:bg-black sm:p-8 rounded-xl">
                <div className="mt-1 sm:pr-8">
                    <div className="flex justify-between">
                        <p className="text-xl font-bold text-gray-700 dark:text-white">{memo.name} </p>
                        <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-7 h-7 text-pink-600 dark:text-cyan-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        >
                        <path strokeLineCap="round" strokeLineJoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{memo.message}</p>
                    <p className="mt-2 text-gray-900 dark:text-white">&#9200; {memo.timestamp.toString()}</p>
                </div>
            </div>
        </div>
            )
        }))}
      </div>

      <footer className={styles.footer}>
        <a
          href="https://alchemy.com/?a=roadtoweb3weektwo"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-900 dark:text-white"
        >
          Created with &#128156; by OMA for Alchemy`s Road to Web3 lesson two!
        </a>
      </footer>
    </div>
  )
}
