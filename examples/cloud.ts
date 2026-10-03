import { defineDiagram } from '../src/index.js';
import { registerIconPack } from '../src/render/index.js';
import type { RenderDiagramOptions } from '../src/server/index.js';

// These are plain stand-in icons so the example is self-contained. To use the official AWS
// Architecture Icons, download them from AWS and run:
//   diagrammar icons import ./Architecture-Icons.zip --prefix aws --match "/64/" --strip "^(Amazon|AWS)-"
// then register the generated module the same way and keep the same names.
registerIconPack('aws', {
  cloudfront: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  alb: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M12 11 5 17M12 11l7 6"/>',
  ec2: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  rds: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  s3: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6l2 14h12l2-14"/>',
});

export const diagram = defineDiagram({
  title: 'Web app on AWS',
  description: 'Visitors reach CloudFront, which serves static files from S3 and sends requests to a load balancer in front of two app servers and a database.',
  groups: [
    { id: 'region', label: 'us-east-1' },
    { id: 'vpc', label: 'VPC 10.0.0.0/16', parent: 'region' },
    { id: 'public', label: 'Public subnet', parent: 'vpc' },
    { id: 'private', label: 'Private subnets', parent: 'vpc' },
    { id: 'data', label: 'Data subnet', parent: 'vpc' },
  ],
  nodes: [
    { id: 'users', label: 'Visitors', type: 'actor' },
    { id: 'cdn', label: 'CloudFront', group: 'region', icon: 'aws:cloudfront' },
    { id: 'assets', label: 'Static files', subtitle: 'S3', group: 'region', icon: 'aws:s3' },
    { id: 'alb', label: 'Load balancer', subtitle: 'ALB', group: 'public', icon: 'aws:alb' },
    { id: 'app1', label: 'App', subtitle: 'EC2, zone a', group: 'private', icon: 'aws:ec2' },
    { id: 'app2', label: 'App', subtitle: 'EC2, zone b', group: 'private', icon: 'aws:ec2' },
    { id: 'db', label: 'Orders', subtitle: 'RDS Postgres', group: 'data', icon: 'aws:rds', role: 'primary' },
  ],
  edges: [
    { id: 'e1', from: 'users', to: 'cdn' },
    { id: 'e2', from: 'cdn', to: 'assets', label: '/static' },
    { id: 'e3', from: 'cdn', to: 'alb', label: '/api' },
    { id: 'e4', from: 'alb', to: 'app1' },
    { id: 'e5', from: 'alb', to: 'app2' },
    { id: 'e6', from: 'app1', to: 'db' },
    { id: 'e7', from: 'app2', to: 'db' },
  ],
});

export const options: RenderDiagramOptions = {};
