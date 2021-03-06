import React, { Component } from 'react';
import { Row, Col } from 'react-grid-system';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter } from '@fortawesome/free-brands-svg-icons'
import Fuse from 'fuse.js';
import _ from 'lodash';
import { fetchCoin, receiveError, receiveCoin } from '../actions';
import FallingMoney from '../containers/FallingMoney';
import Affiliate from '../containers/Affiliate';
import styles from './Calculation.module.css';

class Calculation extends Component {
  constructor(props) {
    super(props);
  }

  state = { roi: 0, netProfit: 0, coinsFetched: false, coin: this.props.match.params.coin, roiCalculated: false };

  componentDidMount = () => {
    if (this.props.coins.length) {
      this.fetchCoinData();
    }
  };

  fetchCoinData() {
    const {
      match: { params },
    } = this.props;

    const date = new Date(params.date);
    const ts = Math.floor(date / 1000);

    if (ts > Math.floor(new Date() / 1000)) {
      return this.props.receiveError('Future dates are invalid');
    }

    let coin = _.find(this.props.coins, { name: params.coin });

    if (!coin) {
      const options = {
        shouldSort: true,
        threshold: 0.2,
        keys: ['name', 'symbol'],
      };
      const fuse = new Fuse(this.props.coins, options);
      const coinsSearch = fuse.search(params.coin);

      if (coinsSearch.length) {
        coin = coinsSearch[0];
        this.setState({ coin: coin.name });
      } else {
        return this.props.receiveError('Invalid coin');
      }
    }

    this.props.fetchCoin(coin.symbol, ts);
    this.setState({ coinsFetched: true });
  }

  calculateRoi() {
    const {
      match: { params },
    } = this.props;

    const coinsBought = parseFloat(params.amount) / this.props.coin.past;
    const totalValue = coinsBought * this.props.coin.current;
    const netProfit = totalValue - parseFloat(params.amount);
    const roi = netProfit / parseFloat(params.amount) * 100;

    this.setState({
      roi: roi.toFixed(2),
      netProfit: netProfit.toFixed(2),
      roiCalculated: true,
    });
  }

  componentDidUpdate = prevProps => {
    if (this.props.coins.length && !this.state.coinsFetched) {
      this.fetchCoinData();
    }

    if (this.props.coin.past && this.props.coin.current && !this.state.roiCalculated) {
      this.calculateRoi();
    } else if (this.props.coin.past === 0 || this.props.coin.current === 0) {
      this.props.receiveError('Date too early');
    }
  };

  componentWillUnmount() {
    this.setState({
      roi: 0,
      netProfit: 0,
      coinsFetched: false,
      roiCalculated: false,
    });

    this.props.receiveCoin(null, null);
    this.props.receiveError(null);
  }

  renderHeader() {
    const {
      match: { params },
    } = this.props;

    if (this.props.error) {
      return <h1 className={styles['header-wrong']}>Hmm. Data not available 🙅 Sorry!</h1>;
    } else if (!this.state.coinsFetched || !this.state.roiCalculated) {
      return <h1 className={styles.header}>Loading...</h1>;
    } else {
      if (this.state.roi >= 0) {
        const twitterStr = `Investing $${params.amount} in ${this.state.coin} on 📅${params.date} would have made $${
          this.state.netProfit
          } 💸which is a ${this.state.roi}% ROI 📈See more on ${window.location.href} 🎉#FOMO #${this.state.coin} #crypto #ToTheMoon`;

        return (
          <h1 className={styles.header}>
            Investing <span className={styles.span}>${params.amount}</span> in <span className={styles.span}>{this.state.coin}</span> on{' '}
            <span className={styles.span}>{params.date}</span> would have made{' '}
            <span className={styles.span}>${this.state.netProfit} 💸</span> which is a{' '}
            <span className={styles.span}>{this.state.roi}% 📈</span> ROI.
            <a
              className="twitter-share-button"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterStr)}`}
              target="_blank"
            >
              <FontAwesomeIcon icon={faTwitter} size="2x" style={{marginLeft: 10}} />
            </a>
          </h1>
        );
      } else {
        const twitterStr = `Phew. I got lucky! 🎉Investing $${params.amount} in ${this.state.coin} on 📅 ${
          params.date
          } would have made me lose ${this.state.netProfit} bucks 💸That's a ${this.state.roi}% loss 📉See more on ${
          window.location.href
          } #FOMO #${params.coin} #crypto #CryptoBubble`;

        return (
          <h1 className={styles.header}>
            Phew. I got lucky! 🎉 Investing <span className={styles.span}>${params.amount}</span> in{' '}
            <span className={styles.span}>{this.state.coin}</span> on <span className={styles.span}>{params.date}</span> would have made me
            lose <span className={styles.span}>{Math.abs(this.state.netProfit)}</span> bucks. That's a{' '}
            <span className={styles.span}>{this.state.roi}%</span> loss.{' '}
            <a
              className="twitter-share-button"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterStr)}`}
              target="_blank"
            >
              <FontAwesomeIcon icon={faTwitter} size="2x" style={{marginLeft: 10}} />
            </a>
          </h1>
        );
      }
    }
  }

  render() {
    return (
      <div>
        <FallingMoney roi={this.state.roi} />

        <Row>
          <Col>{this.renderHeader()}</Col>
        </Row>

        <Row>
          <Col md={4}>
            <Link to={`/`}>
              <button type="button" className={styles.button}>
                See another
              </button>
            </Link>
          </Col>
        </Row>

        <Row>
          <Col>
            <Affiliate />
          </Col>
        </Row>
      </div>
    );
  }
}

const mapStateToProps = ({ coins, coin, error }) => ({ coins, coin, error });
const mapDispatchToProps = dispatch => bindActionCreators({ fetchCoin, receiveError, receiveCoin }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Calculation);
