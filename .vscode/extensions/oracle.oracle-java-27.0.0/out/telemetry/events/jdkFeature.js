"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JdkFeatureEvent = void 0;
/*
  Copyright (c) 2024-2025, Oracle and/or its affiliates.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

     https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
const baseEvent_1 = require("./baseEvent");
class JdkFeatureEvent extends baseEvent_1.BaseEvent {
    constructor(payload) {
        const updatedPayload = baseEvent_1.BaseEvent.transformEvent(JdkFeatureEvent.propertiesToTransform, payload);
        super(JdkFeatureEvent.NAME, JdkFeatureEvent.ENDPOINT, updatedPayload);
    }
    static concatEvents(events) {
        const jdkFeatureEvents = events.filter(event => event.NAME === this.NAME);
        const { previewEnabledMap, previewDisabledMap } = this.groupEvents(jdkFeatureEvents);
        return [
            ...this.createEventsFromMap(previewEnabledMap, true),
            ...this.createEventsFromMap(previewDisabledMap, false)
        ];
    }
    static createEventsFromMap(map, isPreviewEnabled) {
        return Array.from(map.entries()).map(([javaVersion, events]) => {
            const jeps = [];
            const names = [];
            events.forEach(event => {
                if (event.getPayload.jeps)
                    jeps.push(...event.getPayload.jeps);
                if (event.getPayload.names)
                    names.push(...event.getPayload.names);
            });
            return new JdkFeatureEvent({
                jeps,
                names,
                javaVersion,
                isPreviewEnabled
            });
        });
    }
    static groupEvents(jdkFeatureEvents) {
        return jdkFeatureEvents.reduce((acc, event) => {
            const { isPreviewEnabled, javaVersion } = event.getPayload;
            const targetMap = isPreviewEnabled ? acc.previewEnabledMap : acc.previewDisabledMap;
            if (!targetMap.has(javaVersion)) {
                targetMap.set(javaVersion, []);
            }
            targetMap.get(javaVersion).push(event);
            return acc;
        }, {
            previewEnabledMap: new Map(),
            previewDisabledMap: new Map()
        });
    }
}
exports.JdkFeatureEvent = JdkFeatureEvent;
JdkFeatureEvent.NAME = "jdkFeature";
JdkFeatureEvent.ENDPOINT = "/jdkFeature";
JdkFeatureEvent.propertiesToTransform = ['javaVersion'];
//# sourceMappingURL=jdkFeature.js.map