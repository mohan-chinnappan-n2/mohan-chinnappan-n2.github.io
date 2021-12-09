# Chatbots
- Delegate routine tasks to chatbots rather than humans, thus providing huge labor cost savings. 
- Chatbots are capable of processing multiple user requests at a time and are always available.
## 2 types
- rule-based 
	- relies on predefined commands and templates. 
        - Each of these commands should be written by a chatbot developer using regular expressions and textual data analysi

- data-driven
	-  rely on machine learning models pretrained on dialogue data.


## Requirements
-  needs to understand utterances in a natural language. 
-  NLU module translates a user query from natural language into a labeled semantic representation. 
	- **Please set an alarm for 8am**  will be translated into a machine-understandable form like 
		- **set_alarm(8 am)**
- Dialog Manager (DM)
	- keeps track of dialogue state
        - decides what to answer to the user
	- NLG -  Natural Language Generator translates a seamantic representation into human language
		- **rent_price(Atlanta) = 3000 USD** to
		- **The rent price in Atlanta is around $3000**

![bot arch](https://1.bp.blogspot.com/-avNxLnd2DcY/XbdbGVzFv9I/AAAAAAAAARE/CwBkJyfQSI8OJJO-u1lsnR4yp_Rb9KwrQCNcBGAsYHQ/s1600/2.png)



#  DeepPavlov 
- comes with several predefined components for solving NLP-related problems.



# References
- [DeepPavlov: An open-source library for end-to-end dialogue systems and chatbots](https://blog.tensorflow.org/2019/09/deeppavlov-open-source-library-for-end.html)

# Creation
```
sfdx mohanc:slides:gen -i chatbots.md -o chatbots.md.html -t "Chatbots"

```
