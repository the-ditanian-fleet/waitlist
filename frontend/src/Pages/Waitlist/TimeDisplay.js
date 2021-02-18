import React from "react";

export class TimeDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.state = { time: Date.now() };
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({ time: Date.now() });
    }, 60000);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  render() {
    var time = new Date(this.state.time - this.props.relativeTo.getTimezoneOffset() * 60000);
    var timeDiff = Math.abs(Math.round((this.props.relativeTo - time) / 1000 / 60));
    return <span className="tag is-light">{timeDiff} min</span>;
  }
}
