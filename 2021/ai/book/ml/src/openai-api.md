# OpenAI API

### Completion

```bash
curl https://api.openai.com/v1/engines/davinci/completions \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY \
  -d '{
  "prompt": "Once upon a time",
  "max_tokens": 5
}'

```

- Result
```json
{
  "id": "cmpl-4DmYlIcNgBh26avH8t5mMMWwgILGE",
  "object": "text_completion",
  "created": 1639190275,
  "model": "davinci:2020-05-03",
  "choices": [
    {
      "text": ", there was a software",
      "index": 0,
      "logprobs": null,
      "finish_reason": "length"
    }
  ]
}

```


### Search

```bash
curl https://api.openai.com/v1/engines/davinci/search \
  -H "Content-Type: application/json" \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{
  "documents": ["White House", "hospital", "school"],
  "query": "the president"
}'
```


```json
{
  "object": "list",
  "data": [
    {
      "object": "search_result",
      "document": 0,
      "score": 215.56
    },
    {
      "object": "search_result",
      "document": 1,
      "score": 55.614
    },
    {
      "object": "search_result",
      "document": 2,
      "score": 40.932
    }
  ],
  "model": "davinci:2020-05-03"
}

```

### Create Classification

```bash
curl https://api.openai.com/v1/classifications \
  -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "examples": [
      ["A happy moment", "Positive"],
      ["I am sad.", "Negative"],
      ["I am feeling awesome", "Positive"]],
    "query": "It is a raining day :(",
    "search_model": "ada",
    "model": "curie",
    "labels":["Positive", "Negative", "Neutral"]
  }'

```


```json

{
  "completion": "cmpl-4DmdStcV7tC6o5VJnoihr4TDFHse4",
  "label": "Negative",
  "model": "curie:2020-05-03",
  "object": "classification",
  "search_model": "ada",
  "selected_examples": [
    {
      "document": 1,
      "label": "Negative",
      "text": "I am sad."
    },
    {
      "document": 0,
      "label": "Positive",
      "text": "A happy moment"
    },
    {
      "document": 2,
      "label": "Positive",
      "text": "I am feeling awesome"
    }
  ]
}


```

### Answers

```bash
curl https://api.openai.com/v1/answers \
  -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "documents": ["Puppy A is happy.", "Puppy B is sad."],
    "question": "which puppy is happy?",
    "search_model": "ada",
    "model": "curie",
    "examples_context": "In 2017, U.S. life expectancy was 78.6 years.",
    "examples": [["What is human life expectancy in the United States?","78 years."]],
    "max_tokens": 5,
    "stop": ["\n", "<|endoftext|>"]
  }'

  ```


  ```json
  {
  "answers": [
    "puppy A."
  ],
  "completion": "cmpl-4DmgSrZJ7sQx6lWRbaMyskSN68qCE",
  "model": "curie:2020-05-03",
  "object": "answer",
  "search_model": "ada",
  "selected_documents": [
    {
      "document": 0,
      "text": "Puppy A is happy. "
    },
    {
      "document": 1,
      "text": "Puppy B is sad. "
    }
  ]
}

```

### List Files

```bash
curl https://api.openai.com/v1/files \
  -H 'Authorization: Bearer YOUR_API_KEY'


```


```json
{
  "object": "list",
  "data": []
}

```

### Upload Files
```bash
curl https://api.openai.com/v1/files \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F purpose="answers" \
  -F file='@puppy.jsonl'

```


### Delete File 
```bash
curl https://api.openai.com/v1/files/file-XjGxS3KTG0uNmNOK362iJua3 \
  -X DELETE \
  -H 'Authorization: Bearer YOUR_API_KEY'

```

### Retrieve File Information
```bash
curl https://api.openai.com/v1/files/file-XjGxS3KTG0uNmNOK362iJua3 \
  -H 'Authorization: Bearer YOUR_API_KEY'

```

### Retrieve File Content

```bash

curl https://api.openai.com/v1/files/file-XjGxS3KTG0uNmNOK362iJua3/content \
  -H 'Authorization: Bearer YOUR_API_KEY' > file.jsonl


```


### Fine Tunes

- Manage fine-tuning jobs to tailor a model to your specific training data.


```bash
curl https://api.openai.com/v1/fine-tunes \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
  "training_file": "file-XGinujblHPwGLSztz8cPS8XY"
}'

```

### List fine-tunes
```bash
curl https://api.openai.com/v1/fine-tunes \
  -H 'Authorization: Bearer YOUR_API_KEY'

```

### List fine-tune information
```bash
curl https://api.openai.com/v1/fine-tunes/ftjob-AF1WoRqd3aJAHsqc9NY7iL8F \
  -H "Authorization: Bearer YOUR_API_KEY"

```

### Cancel a fine-tune
```bash
curl https://api.openai.com/v1/fine-tunes/ftjob-AF1WoRqd3aJAHsqc9NY7iL8F/cancel \
  -X POST \
  -H "Authorization: Bearer YOUR_API_KEY"

```

### List fine-tune events
```bash
curl https://api.openai.com/v1/fine-tunes/ftjob-AF1WoRqd3aJAHsqc9NY7iL8F/events \
  -H "Authorization: Bearer YOUR_API_KEY"

```


### Embeddings
- Get a vector representation of a given input that can be easily consumed by machine learning models and algorithms.


```bash
curl https://api.openai.com/v1/engines/babbage-similarity/embeddings \
  -X POST \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": "The food was delicious and the waiter..."}' 

```

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [
        0.002866707742214203,
        0.01886799931526184,
        -0.03013569489121437,
        -0.004034548997879028,
        ...
      ]
     "index": 0
    }
  ],
  "model": "babbage-similarity-model:2021-09-20"
}

```
