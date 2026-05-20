import Constants from 'expo-constants';
import mqtt, { type MqttClient } from 'mqtt';

type MqttStatus = 'idle' | 'connecting' | 'connected' | 'error';

type StatusListener = (status: MqttStatus, error?: Error) => void;

type MessageHandler = (payload: string) => void;

type TopicHandlers = Map<string, Set<MessageHandler>>;

const getConfiguredMqttUrl = (): string | undefined => {
  const extra = (Constants.expoConfig as { extra?: Record<string, unknown> })?.extra;
  const url = typeof extra?.MQTT_URL === 'string' ? extra.MQTT_URL : undefined;
  return url?.trim() ? url.trim() : undefined;
};

const isWebSocketUrl = (url: string) => url.startsWith('ws://') || url.startsWith('wss://');

class MqttService {
  private client: MqttClient | null = null;
  private status: MqttStatus = 'idle';
  private statusListeners = new Set<StatusListener>();
  private topicHandlers: TopicHandlers = new Map();
  private currentUrl: string | null = null;

  connect(urlOverride?: string) {
    const url = urlOverride || getConfiguredMqttUrl();
    if (!url) {
      this.updateStatus('error', new Error('MQTT_URL is not configured'));
      return;
    }

    if (!isWebSocketUrl(url)) {
      this.updateStatus('error', new Error('MQTT_URL must use ws:// or wss://'));
      return;
    }

    if (this.client && this.currentUrl === url) {
      return;
    }

    if (this.client) {
      this.client.end(true);
      this.client = null;
    }

    this.currentUrl = url;
    this.updateStatus('connecting');

    const client = mqtt.connect(url);
    this.client = client;

    client.on('connect', () => {
      this.updateStatus('connected');
      this.resubscribeAll();
    });

    client.on('reconnect', () => {
      this.updateStatus('connecting');
    });

    client.on('close', () => {
      if (this.status !== 'error') {
        this.updateStatus('idle');
      }
    });

    client.on('error', (error) => {
      this.updateStatus('error', error instanceof Error ? error : new Error('MQTT error'));
    });

    client.on('message', (topic, payload) => {
      const handlers = this.topicHandlers.get(topic);
      if (!handlers || handlers.size === 0) return;
      const message = payload.toString();
      handlers.forEach((handler) => handler(message));
    });
  }

  subscribe(topic: string, handler: MessageHandler) {
    if (!this.topicHandlers.has(topic)) {
      this.topicHandlers.set(topic, new Set());
    }

    this.topicHandlers.get(topic)?.add(handler);

    if (this.client && this.status === 'connected') {
      this.client.subscribe(topic);
    }
  }

  unsubscribe(topic: string, handler: MessageHandler) {
    const handlers = this.topicHandlers.get(topic);
    if (!handlers) return;

    handlers.delete(handler);

    if (handlers.size === 0) {
      this.topicHandlers.delete(topic);
      if (this.client && this.status === 'connected') {
        this.client.unsubscribe(topic);
      }
    }
  }

  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  getStatus() {
    return this.status;
  }

  private resubscribeAll() {
    if (!this.client) return;
    for (const topic of this.topicHandlers.keys()) {
      this.client.subscribe(topic);
    }
  }

  private updateStatus(status: MqttStatus, error?: Error) {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status, error));
  }
}

export const mqttService = new MqttService();
export type { MqttStatus };
