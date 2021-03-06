/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { get } from 'lodash';
import { findReason } from './find_reason';

export function handleResponse(response) {
  const sources = ['persistent', 'transient', 'defaults'];
  for (const source of sources) {
    const monitoringSettings = get(response[source], 'xpack.monitoring');
    if (monitoringSettings !== undefined) {
      const check = findReason(monitoringSettings, {
        context: `cluster ${source}`
      });

      if (check.found) {
        return check;
      }
    }
  }

  return { found: false };
}

export async function checkClusterSettings(req) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('admin');
  const response = await callWithRequest(req, 'transport.request', {
    method: 'GET',
    path: '/_cluster/settings?include_defaults',
    filter_path: [
      'persistent.xpack.monitoring',
      'transient.xpack.monitoring',
      'defaults.xpack.monitoring'
    ]
  });

  return handleResponse(response);
}
