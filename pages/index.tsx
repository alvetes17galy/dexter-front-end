import React from 'react';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import { query } from '../lib/db';

import ReactDOM from 'react-dom'
import LoginForm from '../components/ui/LoginForm'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';


export default function Home() {

  const [showLoginForm, setShowLoginForm] = useState(true);
  const [data, setData] = useState([]);

  /* useEffect(() => {
     const fetchData = async () => {
       try {
         const response = await fetch('/api/data');
         const results = await response.json();
         setData(results);
       } catch (error) {
         console.error('Error fetching data:', error);
       }
     };
 
     fetchData();
   }, []);*/

  const handleLoginFormSubmit = () => {
    //Perform Login Actions

    setShowLoginForm(false);
  };
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [sourceDocs, setSourceDocs] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'I am Dexter, your AI assistant at Galy, how can I help you?',
        type: 'apiMessage',
      },
    ],
    history: [],
    pendingSourceDocs: [],
  });

  const { messages, pending, history, pendingSourceDocs } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [passwordEntered, setPasswordEntered] = useState<boolean>(false);
  const [passwordPromptShown, setPasswordPromptShown] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const [fileSubmitted, setFileSubmitted] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const handleSubmitFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    setFileSubmitted(true);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);


    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const { url } = await response.json();
      console.log(`Uploaded file to ${url}`);
    } else {
      console.error(response.statusText);
    }
  };


  /*function checkPassword() {
     const password = prompt('Enter keywords to start using the program:');
     if (password==null)
     {
       setPasswordEntered(false);
     }
     else if (password === 'galy'||password==='2023') {
       setPasswordEntered(true);
       setPasswordPromptShown(true);
         } else {
       alert('Incorrect password. Please try again.');
     }
   }
   useEffect(() => {
     if (!passwordEntered && !passwordPromptShown) {
       setPasswordPromptShown(true);
       checkPassword();
     }
   }, [passwordEntered, passwordPromptShown]);*/


  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {

    const token = localStorage.getItem("token"); //Gets auth token from login response
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();
    const user_input = question
    const model_output = "string";
    const user_feedback = true;


    /*try {
      const response = await fetch("https://dexterv2-16d166718906.herokuapp.com/collect-user-input", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({user_input,model_output,user_feedback}),
      });

      if (response.ok) {
        const responseBody=await response.json();
        console.log(responseBody);
      
      } else {
        // Login failed
        console.log("Failed to store user data")
    
      }
    } catch (error) {
      console.error("Error submitting analytics:", error);
    }*/

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
      pending: undefined,
    }));

    setLoading(true);
    setQuery('');
    setMessageState((state) => ({ ...state, pending: '' }));

    const ctrl = new AbortController();
    //const apiKey=process.env.OPENAI_API_KEY;
    //const apiKey = process.env.OPENAI_API_KEY;
    /*if (!apiKey) {
      throw new Error('API key not found');
    }*/
    const encodedApiKey = process.env.OPENAI_API_KEY;

    try {
      fetchEventSource('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${encodedApiKey}`,
        },

        body: JSON.stringify({
          question,
          history,
          token,
        }),
        signal: ctrl.signal,
        onmessage: (event) => {
          if (event.data === '[DONE]') {
            setMessageState((state) => ({
              history: [...state.history, [question, state.pending ?? '']],
              messages: [
                ...state.messages,
                {
                  type: 'apiMessage',
                  message: state.pending ?? '',
                  sourceDocs: state.pendingSourceDocs,
                },
              ],
              pending: undefined,
              pendingSourceDocs: undefined,
            }));
            setLoading(false);
            ctrl.abort();
          } else {
            const data = JSON.parse(event.data);
            if (data.sourceDocs) {
              setMessageState((state) => ({
                ...state,
                pendingSourceDocs: data.sourceDocs,
              }));
            } else {
              setMessageState((state) => ({
                ...state,
                pending: (state.pending ?? '') + data.data,
              }));
            }
          }
        },
      });
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = useCallback(
    (e: any) => {
      if (e.key === 'Enter' && query) {
        handleSubmit(e);
      } else if (e.key == 'Enter') {
        e.preventDefault();
      }
    },
    [handleSubmit, query],
  );

  const chatMessages = useMemo(() => {
    return [
      ...messages,
      ...(pending
        ? [
          {
            type: 'apiMessage',
            message: pending,
            sourceDocs: pendingSourceDocs,
          },
        ]
        : []),
    ];
  }, [messages, pending, pendingSourceDocs]);

  //scroll to bottom of chat
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [chatMessages]);


  return (
    <>
      {!showLoginForm ? (
        <Layout>
          <div className="mx-auto flex flex-col gap-4">
            <form onSubmit={handleSubmitFile}>
              <input
                type="file"
                name="pdf"
                onChange={handleFileChange}
                className="appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
              <button type="submit" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Submit
              </button>
              {fileSubmitted && showMessage && (
                <div className="text-green-300 ml-4">PDF ingested</div>
              )}
            </form>
            <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
              Welcome to Dexter  💚❤️🌏🌱🔬
            </h1>

            <main className={styles.main}>
              <div className={styles.cloud}>
                <div ref={messageListRef} className={styles.messagelist}>
                  {chatMessages.map((message, index) => {
                    console.log('Message:', message); // Add this line to log the message content

                    let icon;
                    let className;
                    if (message.type === 'apiMessage') {
                      icon = (
                        <Image
                          src="/dexter.png"
                          alt="AI"
                          width="40"
                          height="40"
                          className={styles.boticon}
                          priority
                        />
                      );
                      className = styles.apimessage;
                    } else {
                      icon = (
                        <Image
                          src="/bot-image.png"
                          alt="Me"
                          width="30"
                          height="30"
                          className={styles.usericon}
                          priority
                        />
                      );

                      className =
                        loading && index === chatMessages.length - 1
                          ? styles.usermessagewaiting
                          : styles.usermessage;
                    }
                    return (
                      <>
                        <div key={`chatMessage-${index}`} className={className}>
                          {icon}
                          <div className={styles.markdownanswer}>
                            <ReactMarkdown linkTarget="_blank">
                              {message.message}

                            </ReactMarkdown>
                          </div>
                        </div>

                        {message.sourceDocs && (
                          <div className="p-5" key={`sourceDocsAccordion-${index}`}>
                            <Accordion type="single" collapsible className="flex-col">
                              {message.sourceDocs.reduce((uniqueSources: any[], doc: any) => {
                                const existingSource = uniqueSources.find(
                                  (source) => source.metadata.APA === doc.metadata.APA
                                );

                                if (!existingSource) {
                                  uniqueSources.push(doc);
                                }

                                return uniqueSources;
                              }, []).map((uniqueDoc: any, index: number) => (
                                <div key={`messageSourceDocs-${index}`}>
                                  <AccordionItem value={`item-${index}`}>
                                    <AccordionTrigger>
                                      <h3>Source {index + 1}</h3>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <p className="mt-2">
                                        <b>APA Citation:</b> {uniqueDoc.metadata.APA}
                                      </p>
                                      <p className="mt-2">
                                        <b>Download PDF:</b>{" "}
                                        <a
                                          href={uniqueDoc.metadata.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 underline hover:text-blue-700"
                                        >
                                          {uniqueDoc.metadata.url}
                                        </a>
                                      </p>
                                    </AccordionContent>
                                  </AccordionItem>
                                </div>
                              ))}
                            </Accordion>
                          </div>
                        )}


                      </>
                    );
                  })}
                  {sourceDocs.length > 0 && (
                    <div className="p-5">
                      <Accordion type="single" collapsible className="flex-col">
                        {sourceDocs.map((doc, index) => (
                          <div key={`SourceDocs-${index}`}>
                            <AccordionItem value={`item-${index}`}>
                              <AccordionTrigger>
                                <h3>Source {index + 1}</h3>
                              </AccordionTrigger>
                              <AccordionContent>
                                <ReactMarkdown linkTarget="_blank">
                                  {doc.pageContent}
                                </ReactMarkdown>
                              </AccordionContent>
                            </AccordionItem>
                          </div>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.center}>
                <div className={styles.cloudform}>
                  <form onSubmit={handleSubmit}>
                    <textarea
                      disabled={loading}
                      onKeyDown={handleEnter}
                      ref={textAreaRef}
                      autoFocus={false}
                      rows={1}
                      maxLength={512}
                      id="userInput"
                      name="userInput"
                      placeholder={
                        loading
                          ? 'Waiting for response...'
                          : ''
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className={styles.textarea}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className={styles.generatebutton}
                    >
                      {loading ? (
                        <div className={styles.loadingwheel}>
                          <LoadingDots color="#000" />
                        </div>
                      ) : (
                        // Send icon SVG in input field
                        <svg
                          viewBox="0 0 20 20"
                          className={styles.svgicon}
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                        </svg>
                      )}
                    </button>
                  </form>
                </div>
              </div>
              {error && (
                <div className="border border-red-400 rounded-md p-4">
                  <p className="text-red-500">{error}</p>
                </div>
              )}
            </main>
          </div>
          <footer className="m-auto p-4">
            @Galy 2023.
          </footer>

        </Layout>) : (<div><LoginForm onSubmit={handleLoginFormSubmit} /></div>)}
    </>
  );


}

