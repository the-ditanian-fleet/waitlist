import React from "react";
import { Badge } from "../../Components/Badge";

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
    var joinedAt = new Date(this.props.relativeTo * 1000);
    var timeDiff = Math.round((time - joinedAt) / 1000 / 60);
    if (this.props.isAlt) {
      return (
        <span title={timeDiff + " min"}>
          <Badge variant="danger">ALT</Badge>
        </span>
      );
    } else {
      return <Badge variant="secondary">{timeDiff} min</Badge>;
    }
  }
}
