import React from 'react';
import {
  Form,
  Select,
  Input,
  DatePicker,
  Button,
  Rate,
  Typography,
  Space,
  message,
} from 'antd';
import './App.less';
import axios from 'axios';
import Cleave from 'cleave.js/react';

const BACKEND_URL = process.env.REACT_APP_API_URL;

const { Option } = Select;
const { Title } = Typography;
class App extends React.Component {
  constructor(props) {
    super(props);
    console.log(
      'contract number from ENV=',
      process.env.REACT_APP_CONTRACT_NUMBER,
      'REACT_APP_API_URL=',
      process.env.REACT_APP_API_URL
    );
    this.state = {
      challenge: '',
      challengeLoading: false,
      contractNumber: process.env.REACT_APP_CONTRACT_NUMBER,
      dateString: '',
      ubsSecret: '',
      submitLoading: false,
    };
  }

  loadChallenge = () => {
    this.setState({ challengeLoading: true });
    axios
      .get(`${BACKEND_URL}/challenge`, {
        params: { contractNumber: this.state.contractNumber },
      })
      .then((response) => {
        this.setState({ challenge: response.data, challengeLoading: false });
      });
  };

  changeDate = (date, dateString) => {
    console.log(date, dateString);
    if (date) {
      const myDateString = date.format('YYYYMMDD');
      this.setState({ dateString: myDateString });
    } else {
      this.setState({ dateString: null });
    }
  };

  submitReponse = () => {
    this.setState({ submitLoading: true });

    axios
      .post(`${BACKEND_URL}/challenge-response`, {
        responseString: this.state.ubsSecret,
        startDate: this.state.dateString,
      })
      .then((response) => {
        this.setState({ submitLoading: false });
        console.log(response);
        message.success('Successfully received account statements');
      });
  };

  render = () => {
    const {
      challenge,
      challengeLoading,
      contractNumber,
      ubsSecret,
      dateString,
      submitLoading,
    } = this.state;
    return (
      <>
        <section
          style={{ textAlign: 'center', marginTop: 48, marginBottom: 40 }}
        >
          <Space align="start">
            <Title level={2} style={{ marginBottom: 0 }}>
              Export from YNAB
            </Title>
          </Space>
        </section>
        <Form labelCol={{ span: 8 }} wrapperCol={{ span: 8 }}>
          <Form.Item label="Contract Number">
            <Input
              maxLength={8}
              value={contractNumber}
              onChange={(e) =>
                this.setState({ contractNumber: e.target.value })
              }
            />
          </Form.Item>
          <Form.Item
            label="Challenge"
            help="Please don't request the challenge more than 3 times. Otherwise
              you might get rate-limited and blocked by UBS"
          >
            <span className="ant-form-text">{challenge}</span>
            <Button
              type="secondary"
              loading={challengeLoading}
              onClick={() => this.loadChallenge()}
            >
              Get Challenge
            </Button>
            {/* <Typography.Text className="ant-form-text" type="secondary">
              {' '}
              S{' '}
            </Typography.Text> */}
          </Form.Item>
          <Form.Item label="Enter UBS Secret">
            <Cleave
              className="ant-input"
              placeholder="XX XX XX XX"
              disabled={!challenge}
              options={{
                blocks: [2, 2, 2, 2],
                uppercase: true,
              }}
              onChange={(event) => {
                this.setState({ ubsSecret: event.target.value });
              }}
            />
          </Form.Item>
          <Form.Item label="Start Date">
            <DatePicker onChange={this.changeDate} disabled={!challenge} />
          </Form.Item>
          <Form.Item wrapperCol={{ span: 8, offset: 8 }}>
            <Space>
              <Button
                type="primary"
                loading={submitLoading}
                disabled={!(ubsSecret && dateString && challenge)}
                onClick={() => this.submitReponse()}
              >
                {/* <Button type="primary" disabled={!(ubsSecret && dateString)} loading={submitLoading} onClick={() => this.submitReponse()}> */}
                Submit
              </Button>
              {submitLoading && (
                <Typography.Text className="ant-form-text" type="secondary">
                  Fetching the data will take a while
                </Typography.Text>
              )}
            </Space>
          </Form.Item>
          <Form.Item wrapperCol={{ span: 8, offset: 8 }}>
            <a href={`${BACKEND_URL}`}>Browse Account Statements</a>
            {/* <pre>{JSON.stringify(this.state, null, ' ')}</pre> */}
          </Form.Item>
        </Form>
      </>
    );
  };
}
export default App;
