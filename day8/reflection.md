# Day 8 Reflection

**The most difficult concept.** The hardest concept in this course for me was APIs and database transactions. I could follow the definitions, but I did not understand how they actually work: how a request travels to a server and back, and how a database keeps several changes safe when many people act at the same time.

**How I overcame it.** I turned to YouTube and watched step-by-step tutorials on how APIs are set up and how transactions behave. Seeing real examples made the idea clear. An API is an agreed way for one program to ask another for something, and a transaction groups several steps so they either all succeed or all fail. This assignment made it concrete, because preventing two people from buying the same seat depends on exactly these two ideas working together.

**What I would improve in my capstone.** Based on the feedback I received, I would improve how my capstone handles data that must change together. Any action that updates more than one place should run as a single transaction, so a failure part-way never leaves the data half-finished. I would also add input validation and clear error responses to my API endpoints, so users get helpful messages instead of silent failures.

**What I will learn next.** I want to learn how databases keep different kinds of data separate even when they look very similar, such as through table design, constraints, keys and indexes, and how that keeps the data accurate and fast to search.