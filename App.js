import React, { Component } from 'react';
import { StyleSheet, Text, View, AsyncStorage } from 'react-native';
import { Container, Header, Content, Form, Item, Picker, Icon, Body, Title } from 'native-base';
import { AppLoading } from 'expo';

const fetch = require('node-fetch');

import { authKeyId, authKey } from './secret';

class ApiComponent extends Component {
	constructor(props) {
		super(props);

		/**
		 * apiKey: string,
		 * operatorId string,
		 * userName: string,
		 * token: string,
		 */
		this.apiManager = {};

		let retry = 0;
		this.request = (path, method = 'GET', payload = {}, apiKey = this.apiManager.apiKey, token = this.apiManager.token) => {
			const option = {
				method,
				headers: {
					'X-Soracom-API-Key': apiKey,
					'X-Soracom-Token': token
				}
			};
			if (method == 'POST' || method == 'PUT') option.body = JSON.stringify(payload);
			return fetch(`https://api.soracom.io/v1${path}`, option)
				.then(res => res.json())
				.then(json => {
					if (json.code === 'AGW0002') {
						if (++retry > 2) throw `Error: cannot authorization`;
						return this.getApiKey().then(_ => this.request(path, method, payload));
					}
					if ('code' in json) throw `[${json.code}] ${json.message}`;
					retry = 0;
					return json;
				});
		}
	}

	getApiKey() {
		console.log('Call getApiKey');
		return fetch('https://api.soracom.io/v1/auth', {
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ authKeyId, authKey })
		})
			.then(res => res.json())
			.then(json => {
				if (json.code) {
					const message = `[${json.code}] ${json.message}`;
					alert(message);
					throw message;
				}
				return json;
			});
	}

	componentDidMount() {
		AsyncStorage.getItem('@api:info')
			.then(text => {
				if (text == null) return this.getApiKey();

				const stored = JSON.parse(text);
				if (['userName', 'operatorId', 'apiKey', 'token'].find(x => !(x in stored))) {
					// 保存されたデータにキーが足らない
					return this.getApiKey();
				}

				// ユーザー情報をリクエストして、有効期限確認
				return this.request(`/operators/${stored.operatorId}/users/${stored.userName}`
					, 'GET', undefined, stored.apiKey, stored.token)
					.then(json => {
						return json.code === 'AGW0002' ? this.getApiKey() : stored;
					});
			})
			.then(api => {
				this.apiManager = api;
				AsyncStorage.setItem('@api:info', JSON.stringify(this.apiManager));
				Object.entries(this.refs)
					.filter(([k, v]) => v.setApiManager)
					.forEach(([k, v]) => {
						try {
							v.setApiManager({
								userName: api.userName,
								operatorId: api.operatorId,
								request: this.request,
							})
						} catch (e) {
							console.log(e);
							alert(e);
						}
					});
			})
			.catch(_ => console.log(_));
	}

	render() {
		const children = React.Children.map(this.props.children,
			(child, index) => React.cloneElement(child, {
				ref: `child${index}`
			})
		);

		return (
			<View>
				{children}
			</View>
		);
	}
}

class AuthorizationInfo extends Component {
	constructor(props) {
		super(props);
		this.state = { message: 'Authentication....' };
	}

	setApiManager(api) {
		if (!api) {
			this.setState({ message: `Failed to authenticate` });
			return;
		}
		this.setState({ message: `Authorization by ${api.operatorId}::${api.userName}` });
	}

	render() {
		return (
			<View>
				<Text>{this.state.message}</Text>
			</View>
		);
	}

}

class Subscribers extends Component {
	constructor(props) {
		super(props);
		this.state = { subscribers: [] };
	}

	setApiManager(api) {
		if (!api) return;
		api.request('/subscribers')
			.then(json => {
				this.setState({
					subscribers: json.map(s => <View key={s.imsi}>
						<Text>{s.imsi}: {s.type}</Text>
					</View>)
				});
			})
			.catch(_ => alert(_))
			.catch(_ => this.setState({
				subscribers: <Text>Failed to get subscribers</Text>
			}));
	}

	render() {
		return (
			<View>
				<Text>Subscribers</Text>
				{this.state.subscribers}
			</View>
		);
	}
}

class Resource extends Component {
	constructor(props) {
		super(props);
		this.state = { resources: [], selected: undefined };
	}

	setApiManager(api) {
		if (!api) return;
		api.request('/data/resources')
			.then(json => this.setState({
				resources: json.map(r => <Picker.Item key={r.resourceId}
					label={`${r.resourceId} ::${r.tags.name}`}
					value={r}
				/>)
			}))
			.catch(_ => alert(_));
	}

	onValueChange(args) {
		console.log(args);
	}

	render() {
		return (
			<Container>
				<Header><Body><Title>Data source</Title></Body></Header>
				<Content>
					<Form>
						<Item picker>
							<Picker
								mode="dropdown"
								iosIcon={<Icon name="arrow-down" />}
								style={{ width: '100%' }}
								placeholder="Select chart resource"
								placeholderStyle={{ color: "#bfc6ea" }}
								placeholderIconColor="#007aff"
								selectedValue={this.state.selected}
								onValueChange={this.onValueChange.bind(this)}
							>
								{this.state.resources}
							</Picker>
						</Item>
					</Form>
				</Content>
			</Container>
		);
	}
}


export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = { ready: false };
	}

	async loadResourcesAsync() {
		return Expo.Font.loadAsync({
			Roboto: require('./node_modules/native-base/Fonts/Roboto.ttf'),
			Roboto_medium: require('./node_modules/native-base/Fonts/Roboto_medium.ttf'),
		});
	}

	render() {
		if (!this.state.ready) {
			return <AppLoading
				startAsync={this.loadResourcesAsync}
				onFinish={() => this.setState({ ready: true })}
				onError={console.warn}
			/>;
		}

		return (
			<View style={styles.container}>
				<ApiComponent>
					<Text>SORACOM Harvest Data Viewer</Text>
					<AuthorizationInfo />
					<Subscribers />
					<Resource />
				</ApiComponent>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
