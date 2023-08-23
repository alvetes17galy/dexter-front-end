

import React, { useEffect, useState } from 'react';
import styles from '@/styles/Home.module.css';
import moment from 'moment';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import Layout from '@/components/librarylayout';
import { MdSearch } from 'react-icons/md';


interface FetchedData {
    records: Paper[];
    total_records: number;
}


interface Paper {
    paper_id: number;
    title: string;
    webpage_url: string;
    keyword: string;
    paper_pdf: string;



}

interface Keyword {
    keyword: string;

}

const PapersPage = () => {

    const currentTime = moment().format('h:mm A M/D/YY');

    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const papersPerPage = 10;


    const [totalRecords, setTotalRecords] = useState(0);
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);




    const [keywords, setKeywords] = useState<Keyword[]>([]);

    useEffect(() => {
        fetch('http://localhost:4002/api/v1/keywords', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then((data: { records: Keyword[] }) => {
                console.log(data);
                setKeywords(data.records);
            })
            .catch(error => console.error('Error fetching keywords:', error));
    }, []);


    useEffect(() => {
        fetch('http://localhost:4002/api/v1/count', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then((data: { total_records: number }) => {
                setTotalRecords(data.total_records);
            })
            .catch(error => console.error('Error fetching total record count:', error));
    }, []);


    useEffect(() => {
        const offset = (currentPage - 1) * papersPerPage;
        const url = `http://localhost:4002/api/v1/papers?offset=${offset}&limit=${papersPerPage}`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then((data: FetchedData) => {
                console.log(data);
                setPapers(data.records);
            })
            .catch(error => console.error('Error fetching papers:', error));
    }, [currentPage, totalRecords]);


    const filteredPapers = papers.filter((paper) =>
        (selectedKeyword === null || paper.keyword === selectedKeyword) &&
        paper.title.toLowerCase().includes(searchQuery.toLowerCase())
    );


    const indexOfLastPaper = currentPage * papersPerPage;
    const indexOfFirstPaper = indexOfLastPaper - papersPerPage;
    const currentPapers = filteredPapers.slice(indexOfFirstPaper, indexOfLastPaper);


    const paginate = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    return (
        <Layout>
            <div className="w-full ">
                <div className="max-w-7xl flex flex-col gap-4 p-4">
                    <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
                        {totalRecords} Documents Scraped from the Cloud 💚❤️🌏🌱🔬
                    </h1>

                    <h3 className="text-1xl font-bold leading-[1.1] tracking-tighter text-center">
                        and all of them are available for you...
                    </h3>
                    <br />
                    <p className="text-1xl leading-[1.1] font-bold tracking-tighter text-center text-red-500">Development issues as of {`[${currentTime}]`}</p>
                    <p className="text-1xl leading-[1.1] tracking-tighter text-center text-red-500"> We are engaged in refining data filtration capabilities, and certain 'filtering' functionalities might still be under development. We apologize for any inconvenience this may cause</p>
                    <div className="flex items-center mb-4">
                        <select
                            value={selectedKeyword || ''}
                            onChange={(e) => setSelectedKeyword(e.target.value)}
                            className="p-1 border rounded-r-md bg-white mr-5  "
                        >
                            <option value="">All Keywords</option>
                            {keywords.map((keyword, index) => (
                                <option key={index} value={keyword.keyword}>
                                    {keyword.keyword}
                                </option>
                            ))}
                        </select>
                        <div className="p-2 bg-gray-200 rounded-l-md">
                            <MdSearch className="text-gray-600" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="p-2 pl-0 border rounded-r-md"
                        />
                    </div>


                    <Accordion type="single">
                        {papers.map((paper) => (
                            <AccordionItem key={paper.paper_id} value={`item-${paper.paper_id}`}>
                                <AccordionTrigger >{paper.title} &nbsp;&nbsp;&nbsp;</AccordionTrigger>
                                <AccordionContent>
                                    <p className="mt-2">
                                        <b>Category: </b> {paper.keyword}
                                    </p>
                                    <p className="mt-2">
                                        <b>URL:</b>{" "}
                                        <a
                                            href={paper.webpage_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline hover:text-blue-700"
                                        >
                                            {paper.webpage_url}
                                        </a>
                                    </p>
                                    <p className="mt-2">
                                        <b>Download PDF:</b>{" "}
                                        <a
                                            href={paper.paper_pdf}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline hover:text-blue-700"
                                        >
                                            {paper.paper_pdf}
                                        </a>
                                    </p>

                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    <div className="flex justify-center mt-4">
                        {Array.from({ length: Math.ceil(totalRecords / papersPerPage) }).map((_, index) => {
                            const pageNumber = index + 1;
                            if (
                                pageNumber === 1 ||  // Always show the first page button
                                pageNumber === currentPage ||  // Show the current page button
                                pageNumber === currentPage - 1 ||  // Show the page before the current page
                                pageNumber === currentPage + 1 ||  // Show the page after the current page
                                pageNumber === Math.ceil(totalRecords / papersPerPage)  // Always show the last page button
                            ) {
                                return (
                                    <button
                                        key={index}
                                        className={`mx-1 px-3 py-1 rounded ${currentPage === pageNumber ? 'bg-red-500 text-white' : 'bg-gray-200'
                                            }`}
                                        onClick={() => paginate(pageNumber)}
                                        disabled={currentPage === pageNumber}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            } else if (
                                pageNumber === currentPage - 2 ||  // Show three dots when there's a gap before the current page
                                pageNumber === currentPage + 2     // Show three dots when there's a gap after the current page
                            ) {
                                return <span key={index} className="mx-1">...</span>;
                            }
                            return null;
                        })}
                    </div>

                </div>
            </div>
        </Layout>
    );
};

export default PapersPage;
