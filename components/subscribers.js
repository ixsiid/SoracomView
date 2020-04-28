import React, { Component } from 'react';
import { Content, ListItem, Separator, Container, Header } from 'native-base';
import { Text } from 'react-native';


class Subscribers extends Component {
	constructor(props) {
		super(props);
		this.state = {
			subscribers: ['Now loading']
		};
	}

	setApiManager(api) {
		if (!api) return;
		api.request('/subscribers')
			.then(json => {
				this.setState({
					subscribers: json.map(s => `${s.imsi}: ${s.type}`)
				});
			})
			.catch(_ => alert(_))
			.catch(_ => this.setState({
				subscribers: ['Failed to get subscribers']
			}));
	}

	render() {
		return (
			<Content style={{ ...this.props.style }}>
				<Separator bordered style={{ height: 10 }}>
					<Text>Subscribers</Text>
				</Separator>
				{this.state.subscribers.map((text, i) => (
					<ListItem key={`_subscriber_${i}`} style={{ height: 16 }}><Text>{text}</Text></ListItem>
				))}
			</Content>
		);
	}
}

export default Subscribers;