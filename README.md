nextup
======
Our HR short project was Nextup, a reading recommendation engine. The premise of Nextup was to predict what article a user should read next based on what they were reading now. The aim was to reduce search ambiguity and cruft, by curating a list of relevant reading so that users could spend less time searching for interesting articles and more time reading.

Our first step was to select our corpus, a body of written works from which to pull our articles for suggestions. For building and testing our algorithm we needed a corpus that had a wide variety of articles sources but they had to have similar themes and topics so we could dig in and pull out really relevant material. 

Since we are at Hack Reactor, we chose Y Combinator’s Hacker News Big Rss Feed, a frequently updated 300 article feed about the tech industry, coding and fundraising, all stuff we found relevant. This gave us access to a large and diverse base from which to pull our material but it ensured that there would be enough concurrent themes so that we would be shooting into the dark.

We scraped the sites using a Node.js server that read the HN Big RSS feed, follow the article links and parse each article into a word-table that represented every relevant word in a document and the number of times it occurs in said document. I say relevant words, because there are many parts of speech like pronouns, prepositions and conjunctions (many adverbs too) that are so common that they lose value. It was an easy optimization step for us to filter out these terms as we collect the words and build the documents word table. We also had to filter out the more resilient html tags, tabs, new-lines, foreign characters and JavaScript that made it through our scrape.

Once we had our corpus collected and our word table data objects parsed, loaded the whole kit and caboodle into a Neo4j database. Neo4j is a graph database, it differs from the SQL based db’s you're probably familiar with, in that they both store pieces data that are similar, but Neo4j emphasizes the relationships between the individual pieces of data, rather than the pieces of data themselves.

