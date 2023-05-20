// import node module libraries
import { useState } from 'react';
import { Col, Row, Container, Button, Card, Spinner, Form } from 'react-bootstrap';
import axios from 'axios';

// import widget as custom components
import { PageHeading } from 'widgets'

const r2n = () => {
  const [processing, setProcessing] = useState(null);
  const [output, setOutput] = useState(null);
  const [file, setFile] = useState(null);
  const [openAI_Key, setOpenAI_Key] = useState(null);
  const [title, setTitle] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [main_points, setMain_Points] = useState(null);
  const [action_items, setAction_Items] = useState(null);
  const [transcript_arguments, setTranscript_Arguments] = useState(null);
  const [follow_up, setFollow_Up] = useState(null);
  const [related_topics, setRelated_Topics] = useState(null);
  const [custom_prompt, setCustom_Prompt] = useState(null);

  const handleFileUpload = (event) => {
    setFile(event.target.files[0]);
  }

  const handleUpload = async () => {
    setProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('openAI_key', openAI_Key);
    formData.append('title', title);
    formData.append('summary', summary);
    formData.append('sentiment', sentiment);
    formData.append('main_points', main_points);
    formData.append('action_items', action_items);
    formData.append('transcript_arguments', transcript_arguments);
    formData.append('follow_up', follow_up);
    formData.append('related_topics', related_topics);
    formData.append('custom_prompt', custom_prompt);

    try {
      const response = await axios.post('http://54.151.178.103:8652/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log(response.data);
      setOutput(response.data);
    } catch (error) {
      console.error(error);
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
                      <Form.Check.Input type="checkbox" name="title" onChange={(e) => setTitle(e.target.checked)} />
                      <Form.Check.Label>Title</Form.Check.Label>
                    </Form.Check>
                    <Form.Check id="summary">
                      <Form.Check.Input type="checkbox" name="summary" onChange={(e) => setSummary(e.target.checked)} />
                      <Form.Check.Label>Summary</Form.Check.Label>
                    </Form.Check>
                    <Form.Check id="sentiment">
                      <Form.Check.Input type="checkbox" name="sentiment" onChange={(e) => setSentiment(e.target.checked)} />
                      <Form.Check.Label>Sentiment</Form.Check.Label>
                    </Form.Check>
                    <Form.Check id="main_points"  >
                      <Form.Check.Input type="checkbox" name="main_points" onChange={(e) => setMain_Points(e.target.checked)} />
                      <Form.Check.Label>Main Points</Form.Check.Label>
                    </Form.Check>
                    <Form.Check id="action_items" onChange={(e) => setAction_Items(e.target.checked)} >
                      <Form.Check.Input type="checkbox" name="action_items" />
                      <Form.Check.Label>Action Items</Form.Check.Label>
                    </Form.Check>
                    <Form.Check id="transcript_arguments" onChange={(e) => setTranscript_Arguments(e.target.checked)} >
                      <Form.Check.Input type="checkbox" name="transcript_arguments" />
                      <Form.Check.Label>Transcript Arguments</Form.Check.Label>
                    </Form.Check>
                    <Form.Check className="mb-2" id="related_topics" onChange={(e) => setRelated_Topics(e.target.checked)} >
                      <Form.Check.Input type="checkbox" name="related_topics" />
                      <Form.Check.Label>Related Topics</Form.Check.Label>
                    </Form.Check>
                    <input type="text" className="form-control" placeholder="Specific Prompt" id="prompt" required  onChange={(e) => setCustom_Prompt(e.target.value)}/>
                  </Col>
                </Row>
                <Row className="mb-6">
                  <label htmlFor="openai_key" className="col-sm-3 col-form-label
                    form-label">OpenAI Key</label>
                  <div className="col-md-8 col-12">
                    <input className="form-control" placeholder="sk-..." id="open
                    ai_key" required onChange={(e) => setOpenAI_Key(e.target.value)} />
                  </div>
                  <Col md={{ offset: 3, span: 8 }} xs={12} className="mt-4">
                    <p>This key is passed securely to OpenAI and is not saved in our server.</p>
                  </Col>
                </Row>
                <Row>
                  <Col md={6} className="d-grid gap-2 mx-auto">
                    <Button variant="primary"
                      onClick={handleUpload}
                      disabled={processing || (!file || !openAI_Key)}
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
                  <div>
                    {Object.entries(output).map(([key, value], index) => {
                      if (Array.isArray(value)) {
                        return (
                          <div key={index}>
                            <Row className="mb-3">
                              <label className="col-sm-3 form-label">{key.replace(/_/g, ' ').toUpperCase().slice(1)}</label>
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
                              <label className="col-sm-3 form-label">{key.replace(/_/g, ' ').toUpperCase().slice(1)}:</label>
                              <div className="col-md-8 col-12"><p>{value}</p></div>
                            </Row>
                          </div>
                        );
                      }

                      return null;
                    })}
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

export default r2n