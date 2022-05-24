import { v4 as uuidv4 } from 'uuid';
import jQuery from 'jquery';
import { decodeJwt } from 'jose';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import InboxViewList from './containers/InboxViewList';
import ThreadViewList from './containers/ThreadViewList';
import LoginButton from './containers/LoginButton';
import TrackingButton from './containers/TrackingButton';
import ThreadTrackingButton from './containers/ThreadTrackingButton';
import useStore from './containers/store';

// import style required for TS to work
const GmailFactory = require('gmail-js');

// -------------------------------------------------
dayjs.extend(localizedFormat);
// -------------------------------------------------

// required to make TS happy
const gmail = new GmailFactory.Gmail(jQuery) as Gmail;

// -------------------------------------------------

const extensionId = document.currentScript?.dataset.extensionId ?? '';
// TODO(cancan101): handle missing extensionId

const baseUrl = process.env.EMAIL_TRACKING_BACKEND_URL;
const imageBaseUrl = `${baseUrl}/t`;
const reportUrl = `${baseUrl}/report`;
const infoUrl = `${baseUrl}/info`;
const dashboardUrl = `${baseUrl}/dashboard`;
const loginUrl = `${baseUrl}/login/magic`;

const btnTrackingClass = 'btn-tracking';
const btnLoginClass = 'btn-login';
const btnTrackingThreadClass = 'btn-trackingThread';
const btnManageMarginClass = 'btn-manageMargin';

// -------------------------------------------------

console.log(
  `Running gmailJsLoader w/ extensionId: ${extensionId}; baseUrl: ${baseUrl}`
);

// -------------------------------------------------

// TODO(cancan101): use proper state system
let userEmail: string | null = null;
// TODO(cancan101): should we allow this to be null?
let accessToken: string | null = null;
// TODO(cancan101): should we use another sentinel value like 0?
let expiresAt: number | null = null;
let trackingSlug: string | null = null;
let sub: string | null = null;

function getAuthorization(): string {
  return `Bearer ${accessToken}`;
}

function isLoggedIn(): boolean {
  if (!expiresAt || !accessToken) {
    return false;
  }
  if (expiresAt <= new Date().getTime() / 1000) {
    return false;
  }
  return true;
}

async function fetchAuth(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  if (!isLoggedIn()) {
    throw new Error('Not logged in');
  }

  return await fetch(input, {
    ...(init ?? {}),
    headers: { ...(init?.headers ?? {}), Authorization: getAuthorization() },
  });
}

// -------------------------------------------------

gmail.observe.on('view_email', function (domEmail) {
  console.log('Email opened with ID', domEmail.id);
  const emailData = gmail.new.get.email_data(domEmail);
  console.log('Email data:', emailData);
});

const showThreadViews = (views: any[] | null) => {
  gmail.tools.add_modal_window('Tracking information', '', () => {
    gmail.tools.remove_modal_window();
  });
  // TODO(cancan101): cleanup: https://reactjs.org/blog/2015/10/01/react-render-and-top-level-api.html
  render(
    React.createElement(ThreadViewList, { views }, null),
    jQuery('#gmailJsModalWindowContent')[0]
  );
};

const getThreadViews = async (threadId: string): Promise<any[] | null> => {
  try {
    const resp = await fetchAuth(`${infoUrl}?threadId=${threadId}`);
    if (resp.ok) {
      const data = await resp.json();
      const { views } = data;
      return views;
    }
  } catch (e) {
    console.log(e);
  }
  return null;
};

gmail.observe.on('view_thread', function (obj) {
  const threadElem = (obj as any)
    .dom()[0]
    .querySelector('[data-thread-perm-id]');
  if (threadElem) {
    const threadId: string | undefined = threadElem.dataset['threadPermId'];
    if (threadId) {
      const threadData = gmail.new.get.thread_data(threadId);

      console.log('view_thread. obj:', obj, threadId, threadData);

      setTimeout(() => {
        useStore.setState({ isInsideEmail: true });

        const btnTrackingThread = gmail.tools.add_toolbar_button(
          null as any as string,
          null as any as Function,
          `${btnTrackingThreadClass} ${btnManageMarginClass}`
        );
        btnTrackingThread.children().off('click');
        const btnTrackingThreadBtnContainer = document.createElement('div');
        // can we de-jquery some
        jQuery(btnTrackingThread.children()[0]).append(
          jQuery(btnTrackingThreadBtnContainer)
        );

        const threadTrackingButtonElement = React.createElement(
          ThreadTrackingButton,
          {
            getThreadViews: () => getThreadViews(threadId),
            showThreadViews,
          },
          null
        );
        render(threadTrackingButtonElement, btnTrackingThreadBtnContainer);

        const observer = new MutationObserver(function (mutations_list) {
          mutations_list.forEach(function (mutation) {
            mutation.removedNodes.forEach(function (removed_node) {
              if (removed_node.contains(btnTrackingThread[0])) {
                unmountComponentAtNode(btnTrackingThreadBtnContainer);
                observer.disconnect();
              }
            });
          });
        });
        const bar = jQuery('[gh="tm"]');
        observer.observe(bar.parent()[0], {
          subtree: true,
          childList: true,
        });
      }, 0);
    }
  }
});

// -------------------------------------------------

// https://web.dev/constructable-stylesheets/
// const stylesheet = new CSSStyleSheet();
// stylesheet.insertRule(
//   '.tracker-mail-tracked { background-color: green !important; }'
// );
// document.adoptedStyleSheets = [stylesheet];

// -------------------------------------------------

const ids: string[] = [];

gmail.observe.on('load', () => {
  // window.addEventListener(
  //   'settings-retrieved',
  //   function (event: any) {
  //     console.log('settings-retrieved', event.detail);
  //   },
  //   false
  // );
  // window.dispatchEvent(new CustomEvent('get-settings-data'));

  userEmail = gmail.get.user_email();

  console.log('gmail-js loaded!', userEmail);

  const requestLogin = async () => {
    await fetch(loginUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ email: userEmail }),
    });
  };

  const loginBtnContainer = document.createElement('div');

  function setupLogin() {
    const buttons = jQuery(`[gh="mtb"] .${btnLoginClass}`);
    if (buttons.length === 0) {
      const container = gmail.tools.add_toolbar_button(
        null as any as string,
        null as any as Function,
        `${btnLoginClass} ${btnManageMarginClass}`
      );
      container.children().off('click');
      jQuery(container.children()[0]).append(jQuery(loginBtnContainer));

      const loginButtonElement = React.createElement(
        LoginButton,
        {
          requestLogin,
        },
        null
      );
      render(loginButtonElement, loginBtnContainer);
    } else if (buttons.parent().attr('style') != null) {
      // https://github.com/KartikTalwar/gmail.js/issues/518#issuecomment-1132242028
      buttons.parent().attr('style', null);
    } else if (buttons.children().length === 0) {
      // we have to re-attach the container
      buttons.append(jQuery(loginBtnContainer));
    }
  }

  setInterval(function () {
    setupTracking();
    setupLogin();
  }, 500);

  function renderTrackingInfo(views: any[]) {
    gmail.tools.add_modal_window('Tracking information', '', () => {
      gmail.tools.remove_modal_window();
    });
    // TODO(cancan101): cleanup: https://reactjs.org/blog/2015/10/01/react-render-and-top-level-api.html
    render(
      React.createElement(
        InboxViewList,
        { views, closeModal: gmail.tools.remove_modal_window },
        null
      ),
      jQuery('#gmailJsModalWindowContent')[0]
    );
  }

  async function getUserViews(): Promise<any[] | null> {
    const resp = await fetchAuth(`${dashboardUrl}?userId=${sub}`);
    if (resp.ok) {
      const data = await resp.json();
      const allViews = data.views as any[];
      return allViews.slice(0, 10);
    }
    return null;
  }

  const trackingBtnContainer = document.createElement('div');

  function setupTracking() {
    const buttons = jQuery(`[gh="mtb"] .${btnTrackingClass}`);
    if (buttons.length === 0) {
      const container = gmail.tools.add_toolbar_button(
        null as any as string,
        null as any as Function,
        `${btnTrackingClass} ${btnManageMarginClass}`
      );
      container.children().off('click');
      jQuery(container.children()[0]).append(jQuery(trackingBtnContainer));

      const trackingButtonElement = React.createElement(
        TrackingButton,
        {
          getUserViews,
          renderTrackingInfo,
        },
        null
      );
      render(trackingButtonElement, trackingBtnContainer);
    } else if (buttons.parent().attr('style') != null) {
      // https://github.com/KartikTalwar/gmail.js/issues/518#issuecomment-1132242028
      buttons.parent().attr('style', null);
    } else if (buttons.children().length === 0) {
      // we have to re-attach the container
      buttons.append(jQuery(trackingBtnContainer));
    }
    // maybe move
    useStore.setState({ isInsideEmail: gmail.check.is_inside_email() });
  }

  chrome.runtime.sendMessage(
    extensionId,
    { your: 'STORAGE', emailAccount: userEmail },
    function (response: any) {
      // handle the response
      accessToken = response.accessToken as string;
      expiresAt = response.expiresAt as number;
      trackingSlug = response.trackingSlug as string;

      const claims = decodeJwt(accessToken);
      sub = claims.sub ?? null;

      console.log('Received log in info', response, sub);
      useStore.setState({ isLoggedIn: isLoggedIn() });

      const inFutureMs = expiresAt * 1000 - new Date().getTime() + 100;
      if (inFutureMs >= 0) {
        console.log('Will expire in:', inFutureMs);
        setTimeout(() => {
          useStore.setState({ isLoggedIn: isLoggedIn() });
        }, expiresAt);
      }
    }
  );

  gmail.observe.after(
    'send_message',
    async function (url, body, data, response, xhr): Promise<void> {
      // console.log(
      //   'send_message. url:',
      //   url,
      //   'body',
      //   body,
      //   'email_data',
      //   data,
      //   'response',
      //   response,
      //   'xhr',
      //   xhr
      // );

      if (xhr.readyState === 4 && xhr.status === 0) {
        console.log('Issue with send');
        return;
      }

      const emailId = data.id;
      console.log('Email ID:', emailId);

      // const threadId = response[2]?.[6]?.[0]?.[1]?.[1];
      const threadId = JSON.parse(body)[2]?.[1]?.[0]?.[2]?.[1];
      // console.log('Thread ID:', threadId);

      const emailSubject = data.subject;
      console.log('emailSubject:', emailSubject);

      const parser = new DOMParser();
      const document = parser.parseFromString(data.content_html, 'text/html');
      const trackers = document.getElementsByClassName('tracker-img');

      const urls = Array.from(trackers)
        .map((el) => (el instanceof HTMLElement ? el.dataset.src : null))
        .filter((src) => !!src && src.startsWith(imageBaseUrl)) as string[];

      // console.log(
      //   Array.from(trackers).map((el) =>
      //     el instanceof HTMLImageElement ? el.dataset.src : null
      //   )
      // );

      // 38 is length of uuid
      const trackIds = urls.map((src) =>
        src.slice(imageBaseUrl.length + 38, -'image.gif'.length - 1)
      );

      if (trackIds.length > 0) {
        console.log('trackers:', trackIds, ids);

        // figure out if we want to send all trackers or just one
        const trackId = trackIds[trackIds.length - 1];
        const trackIdIdx = ids.indexOf(trackId);

        console.log('trackId:', trackId, 'trackIdIdx', trackIdIdx);

        if (trackIdIdx >= 0) {
          ids.splice(trackIdIdx, 1);
        } else {
          throw Error('Unknown trackerId');
        }

        const reportData = {
          emailId,
          threadId,
          trackId,
          emailSubject,
        };

        try {
          // TODO: do this in then
          await fetchAuth(reportUrl, {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify(reportData),
          });
        } catch (e) {
          console.log(e);
        }
      } else {
        console.log('No trackers found in email');
      }
    }
  );
});

gmail.observe.on('compose', function (compose, _) {
  console.log('compose', compose, compose.id());

  // TODO(cancan101): figure out if the window is re-opened due to a failed send

  gmail.tools.add_compose_button(
    compose,
    'Track',
    () => {
      console.log('Track requested!');

      const trackId = uuidv4();
      console.log(`Using id: ${trackId}`);

      // TODO use lib here:
      const url = `${imageBaseUrl}/${trackingSlug}/${trackId}/image.gif`;

      // let trackingPixelHtml = `<img src="${url}" loading="lazy" height="0" width="0" style="border:0; width:0; height:0; overflow:hidden; display:none !important;" class="tracker-img">`;
      const trackingPixelHtml = `<div height="1" width="1" style="background-image: url('${url}');" data-src="${url}" class="tracker-img"></div>`;

      const mail_body = compose.body();
      // TODO(cancan101): remove old trackers
      compose.body(mail_body + trackingPixelHtml);

      ids.push(trackId);

      compose.send();
    },
    'tracker-mail-tracked'
  );
});
