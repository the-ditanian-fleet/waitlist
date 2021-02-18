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
    var time = this.state.time;
    var joinedAt = new Date(this.props.relativeTo);
    var timeDiff = Math.round((time - joinedAt) / 1000 / 60);
    return <span className="tag is-light">{timeDiff} min</span>;
  }
}
