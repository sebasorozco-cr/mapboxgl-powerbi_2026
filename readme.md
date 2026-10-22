# Mapbox Visual for Microsoft Power BI

## New maintenance team at the Costa Rican Institute of Technology (ITCR)

---

Make sense of your big & dynamic location data with the Mapbox Visual for Power BI. Quickly design high-performance map visuals using graduated circles, clusters, and interactive heatmaps. Even customize your Mapbox visual with custom shapes, imagery, and design using [Mapbox Studio](www.mapbox.com/studio). Check out the [Mapbox Gallery](https://www.mapbox.com/gallery/) to get a sense of what's possible with Studio.

Drop in the Mapbox Visual to your Power BI dashboard from the "New Releases" branch:
- https://github.com/sebasorozco-cr/mapboxgl-powerbi_2026/releases/tag/v1.8.4.1

![](https://dl.dropbox.com/s/kymonz28oanehje/PowerBI-2.gif)

### Example

- [Example Dashboard - 2017 FCC Broadband Speeds in New Jersey](https://app.powerbi.com/view?r=eyJrIjoiMTk4ZDk3OWYtNzc2Ny00NDE0LWE2ZWYtZDk5NjAwZTA3YTljIiwidCI6IjYyOWE3MGIyLTMyYjktNDEyNi05NTFlLTE3NjA0Y2Y0NTZlYyIsImMiOjF9)

### Documentation

- Check out the official Mapbox Visual for Power BI docs at:
  - [Getting Started](https://www.mapbox.com/help/power-bi/)
  - [Creating a Choropleth](https://www.mapbox.com/help/power-bi-choropleth-map/)

### FAQ

#### Firewall rules - Domain names and ports to use with Power BI in a secure environment

The Mapbox Visual by default operates using API resources hosted on `api.mapbox.com` securely requested using HTTPS and your Mapbox access token. If you need all requests to be made inside of your corporate or air-gapped network, you can host [Mapbox Atlas](https://www.mapbox.com/atlas/) on your own server and run the Mapbox Visual for Power BI completely on-premise.

**No data** in the Power BI data model is ever sent to Mapbox APIs. Only the requested reference resources including map style sheets, vector tiles, icons, and fonts are retrieved from Mapbox APIs.

| Domain              | Port | Resource                 |
| ------------------- | ---- | ------------------------ |
| api.mapbox.com      | 443  | icons, map styles, fonts |
| \*.tiles.mapbox.com | 443  | vector tiles             |

#### How many data points does the Mapbox Visual support?

Mapbox supports up to the maximum allowed by Power BI, 30,000 rows, for all visualization types including Choropleth (fill), cluster, heatmap, and circle. If your data is >30k rows, the Mapbox Visual will sample your data down to 30k rows and visualize the resultant sample.

### Developing and Contributing.

- This is an open source repo and we welcome contributions from the public.
- Please see [contributing.md](CONTRIBUTING.md) for more information.

## What is Mapbox?

Mapbox is the location data platform for mobile and web applications. Mapbox provides [building blocks](https://www.mapbox.com/products/) to add location features like maps, search, and navigation into any experience you create. Use our simple and powerful APIs & SDKs and our open source libraries for interactivity and control.

Not a Mapbox user yet? [Sign up for an account here](https://www.mapbox.com/signup/). Once you’re signed in, all you need to start building with Power BI is a Mapbox access token.

## Do you have questions?

Don't hesitate to contact us on the following e-mail address: sorozco@tec.ac.cr

## Screenshots and GIFs

![](https://cl.ly/1J2d1x1q3R3F/download/Image%202018-07-21%20at%201.00.25%20PM.png)

![](https://dl.dropbox.com/s/9rzj04v1u1f2lp4/lasso_select.gif)

![](https://dl.dropbox.com/s/xc4nl5au5gxv8tr/powerbi_drill_choropleth_wildfire.gif)
