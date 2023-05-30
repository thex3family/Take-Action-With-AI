// import node module libraries
import { useState, ChangeEvent } from 'react';
import { Col, Row, Container, Button, Card, Spinner, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

// import widget as custom components
import { PageHeading } from 'widgets'

const R2N = () => {
  const [processing, setProcessing] = useState(null);
  const [output, setOutput] = useState(null);
  const [GPTResponse, setGPTResponse] = useState(null);
  const [file, setFile] = useState(null);
  const [openAI_key, setOpenAI_key] = useState(null);
  const [title, setTitle] = useState(true);
  const [summary, setSummary] = useState(true);
  const [sentiment, setSentiment] = useState(false);
  const [main_points, setMain_Points] = useState(false);
  const [action_items, setAction_Items] = useState(false);
  const [transcript_arguments, setTranscript_Arguments] = useState(false);
  const [follow_up, setFollow_Up] = useState(false);
  const [related_topics, setRelated_Topics] = useState(false);
  const [custom_prompt, setCustom_Prompt] = useState(null);
  const [error, setError] = useState(null);

  const gptChatCompletion = async (request_data) => {
    const { openAI_key, audio_transcript } = request_data;

    // Replace with your own max tokens limit
    const MAX_TOKENS = 2000;

    const splitTranscript = (transcript, maxTokens) => {
      const stringsArray = [];
      let currentIndex = 0;

      while (currentIndex < transcript.length) {
        let endIndex = Math.min(currentIndex + maxTokens, transcript.length);

        // Find the next period
        while (endIndex < transcript.length && transcript[endIndex] !== '.') {
          endIndex++;
        }

        // Include the period in the current string
        if (endIndex < transcript.length) {
          endIndex++;
        }

        // Add the current chunk to the stringsArray
        const chunk = transcript.substring(currentIndex, endIndex);
        stringsArray.push(chunk);

        currentIndex = endIndex;
      }

      return stringsArray;
    };

    const createPromptForChat = (transcript, request_data) => {
      let requestPrompt = 'Analyze the transcript provided below, then provide the following\n';

      if (request_data.title === true) {
        requestPrompt += 'Key "title:" - add a title.\n';
      }
      if (request_data.summary === true) {
        requestPrompt += 'Key "summary" - create a summary.\n';
      }
      if (request_data.main_points === true) {
        requestPrompt += 'Key "main_points" - add an array of the main points. Limit each item to 75 words and be concise.\n';
      }
      if (request_data.action_items === true) {
        requestPrompt += 'Key "action_items:" - add an array of action items. Limit each item to 75 words and be concise.\n';
      }
      if (request_data.follow_up === true) {
        requestPrompt += 'Key "follow_up:" - add an array of follow-up questions. Limit each item to 75 words and be concise.\n';
      }
      if (request_data.transcript_arguments === true) {
        requestPrompt += 'Key "transcript_arguments:" - add an array of potential arguments against the transcript. Limit each item to 75 words and be concise.\n';
      }
      if (request_data.related_topics === true) {
        requestPrompt += 'Key "related_topics:" - add an array of topics related to the transcript. Limit each item to 75 words, and limit the list to 5 items. Use sentence case.\n';
      }
      if (request_data.sentiment === true) {
        requestPrompt += 'Key "sentiment" - add an array of sentiment analysis. Use sentence case.\n';
      }

      return `${requestPrompt}
    
        Ensure that the final element of any array within the JSON object is not followed by a comma.
    
        Transcript:
    
        ${transcript}`;
    };

    const structureResponse = (chatResponses, request_data) => {
      const results_array = chatResponses.map((result) => {
        // ChatGPT loves to occasionally throw commas after the final element in arrays, so let's remove them
        const removeTrailingCommas = (jsonString) => {
          const regex = /,\s*(?=])/g;
          return jsonString.replace(regex, '');
        };

        // Need some code that will ensure we only get the JSON portion of the response
        // This should be the entire response already, but we can't always trust GPT
        let json_string = result.choices[0].message.content;
        json_string = json_string.replace(/^[^{]*?{/g, '{');
        json_string = json_string.replace(/}[^}]*?$/g, '}');
        const cleaned_json_string = removeTrailingCommas(json_string);

        let json_obj;
        try {
          json_obj = JSON.parse(cleaned_json_string);
        } catch (error) {
          console.log('Error while parsing cleaned JSON string:');
          console.log(error);
          console.log('Original JSON string:', json_string);
          console.log('Cleaned JSON string:', cleaned_json_string);
          json_obj = {};
        }

        return {
          choice: json_obj,
          usage: result.usage.total_tokens || 0,
        };
      });

      const arraySum = (arr) => arr.reduce((total, current) => total + current, 0);

      const chat_response = {
        tokens_array: [],
        title: null, // Initialize as null
        summary: null, // Initialize as null
      };

      const settings = ['main_points', 'action_items', 'follow_up', 'transcript_arguments', 'related_topics', 'sentiment'];

      for (const arr of results_array) {
        if (request_data.title === true && arr.choice.title) {
          chat_response.title = arr.choice.title; // Assign the first non-null title
        }
        if (request_data.summary === true && arr.choice.summary) {
          chat_response.summary = arr.choice.summary; // Assign the first non-null summary
        }

        chat_response.tokens_array = chat_response.tokens_array || [];
        chat_response.tokens_array.push(arr.usage);
        for (const key of settings) {
          if (request_data[key] === true) {
            chat_response[key] = chat_response[key] || [];
            chat_response[key].push(arr.choice[key]);
          }
        }
      }

      const final_chat_response = {};

      const keysInOrder = [
        'main_points',
        'action_items',
        'follow_up',
        'transcript_arguments',
        'related_topics',
        'sentiment',
      ];

      final_chat_response.title = chat_response.title;
      final_chat_response.summary = chat_response.summary;

      keysInOrder.forEach((key) => {
        if (request_data[key] === true) {
          final_chat_response[key] = chat_response[key]?.flat?.();
        }
      });

      final_chat_response.tokens = arraySum(chat_response.tokens_array);

      return final_chat_response;
    };

    const callGPT = async (prompt, openAI_key) => {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          messages: [
            { role: 'system', content: 'You are an assistant that only speaks JSON. Do not write normal text.' },
            { role: 'user', content: prompt },
          ],
          model: 'gpt-3.5-turbo',
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openAI_key}`,
          },
        }
      );
      return response.data;
    };

    const split_transcript = splitTranscript(audio_transcript, MAX_TOKENS);
    const response_summary_list = [];

    for (const part_transcript of split_transcript) {
      const prompt = createPromptForChat(part_transcript, request_data);
      const response_summary = await callGPT(prompt, openAI_key);
      response_summary_list.push(response_summary);
    }

    const formattedDocumentDetails = structureResponse(response_summary_list, request_data);
    return formattedDocumentDetails;
  };


  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const data = new FormData();
      data.append("file", file);
      data.append("model", "whisper-1");
      data.append("language", "en");
      setFile(data);

      if (file.size > 25 * 1024 * 1024) {
        alert("Please upload an audio file less than 25MB");
        return;
      }
    }
  };

  const [transcript, setTranscript] = useState(null);

  const handleUpload = async () => {
    setError(null);
    setProcessing(true);
    setOutput(true);
    setTranscript(null);
    setGPTResponse(null);

    try {
      //Fetching the transcript
      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        headers: {
          Authorization: `Bearer ${openAI_key}`,
        },
        method: "POST",
        body: file,
      });

      const data = await res.json();

      if (data.text) {
        setTranscript(data.text);

        const request_data = {
          audio_transcript: data.text,
          openAI_key: openAI_key,
          title: title,
          summary: summary,
          sentiment: sentiment,
          main_points: main_points,
          action_items: action_items,
          transcript_arguments: transcript_arguments,
          follow_up: follow_up,
          related_topics: related_topics,
          custom_prompt: custom_prompt
        };

        const gptResponse = await gptChatCompletion(request_data);

        setGPTResponse(gptResponse);
      }
    } catch (error) {
      console.log(error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Container fluid className="p-6">
      {/* Page Heading */}
      <PageHeading heading="Turn Your Recording Into Notes" />
      <Row className="mt-6">
        <Col xl={{ span: 8, offset: 2 }} lg={{ span: 10, offset: 1 }} md={12} xs={12}>
          <Card>
            <Card.Body>
              <Row className="mb-6">
                <div className="mb-4 mb-lg-0">
                  <h4 className="mb-1">Input</h4>
                  <p className="mb-0 fs-5 text-muted">Send In Your Recording And Choose Your Settings</p>
                </div>
              </Row>
              <Row className="mb-3">
                <Col md={3} className="mb-3 mb-md-0">
                  {/* heading */}
                  <label className="mb-0 col-form-label
                    form-label">Recording</label>
                </Col>
                <Col md={9}>
                  {/* dropzone input */}
                  <div>
                    <input id="file" name="file" type="file" accept="audio/*,video/*" onChange={handleFileUpload} />
                  </div>
                </Col>
              </Row>
              {/* Choose option default */}
              <Row className="mb-6">
                <Form.Label as={Col} md={3} htmlFor="default">Settings</Form.Label>
                <Col md={8} xs={12}>
                  <Form.Check id="title">
                    <Form.Check.Input type="checkbox" name="title" onChange={(e) => setTitle(e.target.checked)} checked={title} disabled />
                    <Form.Check.Label>Title</Form.Check.Label>
                  </Form.Check>
                  <Form.Check id="summary">
                    <Form.Check.Input type="checkbox" name="summary" onChange={(e) => setSummary(e.target.checked)} checked={summary} disabled />
                    <Form.Check.Label>Summary</Form.Check.Label>
                  </Form.Check>
                  <Form.Check id="sentiment">
                    <Form.Check.Input type="checkbox" name="sentiment" onChange={(e) => setSentiment(e.target.checked)} checked={sentiment} />
                    <Form.Check.Label>Sentiment</Form.Check.Label>
                  </Form.Check>
                  <Form.Check id="main_points">
                    <Form.Check.Input type="checkbox" name="main_points" onChange={(e) => setMain_Points(e.target.checked)} checked={main_points} />
                    <Form.Check.Label>Main Points</Form.Check.Label>
                  </Form.Check>
                  <Form.Check id="action_items">
                    <Form.Check.Input type="checkbox" name="action_items" onChange={(e) => setAction_Items(e.target.checked)} checked={action_items} />
                    <Form.Check.Label>Action Items</Form.Check.Label>
                  </Form.Check>
                  <Form.Check id="transcript_arguments">
                    <Form.Check.Input type="checkbox" name="transcript_arguments" onChange={(e) => setTranscript_Arguments(e.target.checked)} checked={transcript_arguments} />
                    <Form.Check.Label>Transcript Arguments</Form.Check.Label>
                  </Form.Check>
                  <Form.Check id="follow_up">
                    <Form.Check.Input type="checkbox" name="follow_up" onChange={(e) => setFollow_Up(e.target.checked)} checked={follow_up} />
                    <Form.Check.Label>Follow Up</Form.Check.Label>
                  </Form.Check>
                  <Form.Check className="mb-2" id="related_topics">
                    <Form.Check.Input type="checkbox" name="related_topics" onChange={(e) => setRelated_Topics(e.target.checked)} checked={related_topics} />
                    <Form.Check.Label>Related Topics</Form.Check.Label>
                  </Form.Check>
                  {/* <input type="text" className="form-control" placeholder="Specific Prompt" id="prompt" required  onChange={(e) => setCustom_Prompt(e.target.value)}/> */}
                </Col>
              </Row>
              <Row className="mb-6">
                <label htmlFor="openai_key" className="col-sm-3 col-form-label
                    form-label">OpenAI Key</label>
                <div className="col-md-8 col-12">
                  <input className="form-control" type="password" placeholder="sk-•••" id="open
                    ai_key" required onChange={(e) => setOpenAI_key(e.target.value)} />
                </div>
                <Col md={{ offset: 3, span: 8 }} xs={12} className="mt-4">
                  <p>This key is passed securely to OpenAI and is not saved in our server.</p>
                </Col>
              </Row>
              <Row>
                <Col md={6} className="d-grid gap-2 mx-auto">
                  {error ? <Alert variant="primary" >Error: {error}. Please try again.</Alert> : null}
                  <Button variant="primary text-white"
                    onClick={handleUpload}
                    disabled={processing || (!file || !openAI_key)}
                  >
                    {processing ? <Spinner animation="border" size="sm" /> : 'Submit'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {output ?
        <Row className="mt-6">
          <Col xl={{ span: 8, offset: 2 }} lg={{ span: 10, offset: 1 }} md={12} xs={12}>
            <Card>
              <Card.Body>
                <Row className="mb-6">
                  <div className="mb-4 mb-lg-0">
                    <h5 className="mb-1">Output</h5>
                    <p className="mb-0 fs-5 text-muted">Your generated information below...</p>
                  </div>
                </Row>
                <Row>
                  {transcript ?
                    <Row className="mb-6">
                      <label className="form-label">TRANSCRIPT</label>
                      <textarea className="mx-2 text-muted">{transcript}</textarea>
                    </Row> : null}
                  <div>
                    {GPTResponse ? Object.entries(GPTResponse).map(([key, value], index) => {
                      if (Array.isArray(value)) {
                        return (
                          <div key={index}>
                            <Row className="mb-3">
                              <label className="col-sm-3 form-label">{key.replace(/_/g, ' ').toUpperCase()}</label>
                              <div className="col-md-8 col-12">
                                <ul>
                                  {value.map((item, i) => (
                                    <li key={i}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </Row>

                          </div>
                        );
                      } else if (typeof value === 'string' || typeof value === 'number') {
                        return (
                          <div key={index}>
                            <Row className="mb-3">
                              <label className="col-sm-3 form-label">{key.replace(/_/g, ' ').toUpperCase()}:</label>
                              <div className="col-md-8 col-12"><p>{value}</p></div>
                            </Row>
                          </div>
                        );
                      }

                      return null;
                    }) : null}
                  </div>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        : null
      }

    </Container>
  )
}

export default R2N
