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
import { useRouter } from 'next/router';
// index.tsx
// Adjust the path accordingly

// ...rest of your code that uses tiktoken




import ReactDOM from 'react-dom'
import LoginForm from '../components/ui/LoginForm'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { run } from '@/scripts/ingest-data';


export default function Home() {

  const [generatingResponse, setGeneratingResponse] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [data, setData] = useState([]);
  let userInput;

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
  const [file, setFile] = useState<File | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [apaCitation, setApaCitation] = useState('')




  const [fileSubmitted, setFileSubmitted] = useState(false);

  const stopGeneratingRef = useRef(false);

  const handlePopupToggle = () => {
    setShowPopup(!showPopup);
  };

  const handleApaCitationChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setApaCitation(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  //let stopGenerating = false;

  /*const handleStopGenerating = () => {
    stopGenerating = true;
    stopGeneratingRef.current = true;
    setLoading(false);
  };*/


  const handleSubmitFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    console.log("Im here")
    setFileSubmitted(true);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
      setShowPopup(false);
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

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  function handleSubmit(e: any) {

    const token = localStorage.getItem("token"); //Gets auth token from login response
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    setGeneratingResponse(true);
    const question = query.trim();
    userInput = question;

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

            stopGeneratingRef.current = false;
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
            setGeneratingResponse(false);

          } else {

            const data = JSON.parse(event.data);


            if (data.sourceDocs) {
              console.log(data)
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
      setGeneratingResponse(false);
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

  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const handlePositiveFeedback = async (message: Messages) => {
    const token = localStorage.getItem("token");
    try {
      // Prepare the data to send
      const feedbackData = {
        user_feedback: 'positive',
        model_output: message.message,
        user_input: ' ',
      };

      // Make a POST request to the endpoint
      const response = await fetch('https://dexterv2-16d166718906.herokuapp.com/collect-user-feedback', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      });

      // Handle the response as needed
      if (response.ok) {
        // Mark the feedback as submitted and perform any other actions
        setFeedbackSubmitted(true);
      } else {
        console.log(feedbackData)
        // Handle error cases
        console.error('Failed to submit negative feedback');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  interface Messages {
    type: string;
    message: string;

  }
  const handleNegativeFeedback = async (message: Messages) => {
    const token = localStorage.getItem("token");
    try {
      // Prepare the data to send
      const feedbackData = {
        user_feedback: 'negative',
        model_output: message.message,
        user_input: ' ',
      };

      // Make a POST request to the endpoint
      const response = await fetch('https://dexterv2-16d166718906.herokuapp.com/collect-user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,

        },
        body: JSON.stringify(feedbackData),
      });

      // Handle the response as needed
      if (response.ok) {

        setFeedbackSubmitted(true);
      } else {
        console.log(feedbackData)
        // Handle error cases
        console.error('Failed to submit positive feedback');
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  };



  interface FeedbackPopupProps {
    setFeedbackSubmitted: (value: boolean) => void;
  }

  const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ setFeedbackSubmitted }) => {
    return (
      <div className={styles['feedback-overlay']}>
        <div className={styles['feedback-popup']}>
          <div className={styles['feedback-popup-content']}>
            <span className={styles['feedback-popup-close']} onClick={() => setFeedbackSubmitted(false)}>
              &times;
            </span>
            <p className={styles['feedback-popup-text']}>Thank you for providing valuable feedback!</p>
          </div>
        </div>
      </div>
    );
  };




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


  interface PopupProps {
    show: boolean;
    onClose: () => void;
    onApaCitationChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    apa: string;

  }



  function Popup({ show, onClose, onApaCitationChange, apa }: PopupProps) {
    const [selectedPdfName, setSelectedPdfName] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [apaCitation, setApaCitation] = useState("");
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);



    const handleSubmitFile = async (event: React.FormEvent<HTMLFormElement>) => {

      event.preventDefault();

      if (!file) return;

      setIsLoading(true);


      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("apaCitation", apaCitation);
      console.log(apaCitation);


      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {


        // Submit the APA citation to the APA citation submission API route
        const apaResponse = await fetch('/api/submit-apa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apaCitation }),
        });

        if (apaResponse.ok) {
          console.log('APA citation submitted successfully.');
        } else {
          console.error('Failed to submit APA citation:', await apaResponse.text());
        }

        setFile(null);
        setSelectedPdfName('');
        setApaCitation('');



        setIsLoading(false); // Reset loading state

        setShowPopup(false);

      } else {
        console.error('File upload failed:', response.statusText);
        setIsLoading(false);
      }

    };

    useEffect(() => {
      textAreaRef.current?.focus();
    }, []);


    const handleApaCitationChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
      setApaCitation(event.target.value);
    };

    const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        setSelectedPdfName(file.name);
        setFile(file);
      }
    };

    useEffect(() => {
      // Focus on the textarea when the popup is shown
      if (show && textAreaRef.current) {
        textAreaRef.current.focus();
      }
    }, [show]);

    if (!show) {
      return null;
    }

    return (
      <div className={styles.popup}>
        <div className={styles.popupContent}>
          <h2 className={styles.popupTitle}>Document Manual Upload</h2>


          <form onSubmit={handleSubmitFile}>
            <div className={styles.apaCitationContainer}>
              <textarea
                value={apaCitation}
                onChange={handleApaCitationChange}
                placeholder="Enter citation..."
                className={styles.apaCitationStyle}
                required
              />
            </div>
            <div className={styles.uploadFileContainer}>

              <div className={styles.uploadFileSquare}>
                {selectedPdfName || <img src="/pdfIcon.png" alt="PDF icon" className={styles.pdfIcon} />}

              </div>
              <input
                type="file"
                name="pdf"
                accept=".pdf"
                onChange={handlePdfFileChange} // Call the handler when file is selected
                className={styles.uploadFileInput}
                required
              />
            </div>
            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
            <button onClick={onClose} className={styles.popupClose}>
              &times;
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.fullscreenoverlay}>

        <div className={styles.overlaycontent}>
          <p className={styles.developmentmessage}>
            Sorry, we are under development as of<b>{' '}
              {new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
              })}{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
              })}</b>
            . Thank you for your patience.
            <br />
            <br /> <img src="/dexter.png" alt="Logo" className={styles.logo} />
            Bests,
            <br />
            <b> Dexter</b>

          </p>
        </div>
      </div>


    </>
  );

}





/*return (
  <>
  
    {!showLoginForm ? (
      <Layout>
        <div className="mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePopupToggle}
              className={`${styles.popupButton} ${styles.pdfButton} border rounded px-2 flex items-center gap-2`}
            >

              <img src="/pdfIcon.png" alt="PDF icon" className={styles.pdfIconButton} />
              <span className="text-sm text-gray-500">Upload a PDF</span>
            </button>
          </div>
          <br></br>
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
            Welcome to Dexter  💚❤️🌏🌱🔬
          </h1>

          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
                {chatMessages.map((message, index) => {

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
                      {feedbackSubmitted && message.type === 'apiMessage' && message.sourceDocs && (
                        <FeedbackPopup setFeedbackSubmitted={setFeedbackSubmitted} />
                      )}
                      {message.type === 'apiMessage' && message.sourceDocs && (
                        <div className={`${styles.feedbackIcons} flex`}>
                          <button
                            onClick={() => handlePositiveFeedback(message)}
                            className={styles.feedbackButton}
                          >
                            <Image
                              src="/positiveIcon.png"
                              alt="Positive Feedback"
                              width="30"
                              height="30"
                              className={`${styles.positiveIcon} mr-2`}
                            />
                          </button>
                          <button
                            onClick={() => handleNegativeFeedback(message)}
                            className={styles.feedbackButton}
                          >
                            <Image
                              src="/negativeIcon.png"
                              alt="Negative Feedback"
                              width="30"
                              height="30"
                              className={styles.negativeIcon}
                            />
                          </button>
                        </div>

                      )}



                      {message.sourceDocs && (
                        <div className="p-5" key={`sourceDocsAccordion-${index}`}>
                          <Accordion type="single" collapsible className="flex-col">
                            {message.sourceDocs.reduce((uniqueSources: any[], doc: any) => {
                              const existingSource = uniqueSources.find(
                                (source) => source.metadata.APA === doc.metadata.APA || source.metadata.apa === doc.metadata.apa
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
                                      <b>APA Citation:</b> {uniqueDoc.metadata.APA || uniqueDoc.metadata.apa}
                                    </p>
                                    <p className="mt-2">
                                      <b>Download PDF:</b>{" "}
                                      <a
                                        href={uniqueDoc.metadata.url || uniqueDoc.metadata.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 underline hover:text-blue-700"
                                      >
                                        {uniqueDoc.metadata.pdf_url || uniqueDoc.metadata.url}
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
                <form onSubmit={(e) => handleSubmit(e)}>
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
    <Popup
      show={showPopup}
      onClose={handlePopupToggle}
      onApaCitationChange={handleApaCitationChange}
      apa={apaCitation}

    />

  </>
);


}*/


