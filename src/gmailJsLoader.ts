import { v4 as uuidv4 } from 'uuid';
import jQuery from 'jquery';
import { decodeJwt } from 'jose';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

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
const imageUrl = `${baseUrl}/image.gif`;
const reportUrl = `${baseUrl}/report`;
const infoUrl = `${baseUrl}/info`;
const dashboardUrl = `${baseUrl}/dashboard`;
const loginUrl = `${baseUrl}/login/magic`;

const btnInfoClass = 'btn-MyButton';

// -------------------------------------------------

console.log(
  `Running gmailJsLoader w/ extensionId: ${extensionId}; baseUrl: ${baseUrl}`
);

// -------------------------------------------------

// TODO(cancan101): use proper state system
let userEmail: string | null = null;
// TODO(cancan101): should we allow this to be null?
let accessToken = '';
// TODO(cancan101): should we use another sentinel value like 0?
let expiresAt: number | null = null;
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

gmail.observe.on('view_thread', function (obj) {
  const threadData = gmail.new.get.thread_data(obj);
  console.log('view_thread. obj:', obj, threadData);
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

  function setupTrackerToolbarForEmail() {
    const emailData = gmail.new.get.email_data(
      // remove this case hack once 1.0.21 released
      undefined as unknown as GmailEmailIdentifier
    );
    const { thread_id } = emailData ?? {};

    const toolbar_button = gmail.tools.add_toolbar_button(
      'Tracking',
      async () => {
        if (thread_id) {
          try {
            const resp = await fetchAuth(`${infoUrl}?threadId=${thread_id}`);
            if (resp.ok) {
              const data = await resp.json();
              const { views } = data;
              let modalContents;

              if (views) {
                const listContents = views.map(
                  (x: any) => `<li>${dayjs(x.createdAt).format('L LT')}</li>`
                );
                modalContents = `<ol>${listContents.join('')}</ol>`;
              } else {
                modalContents = 'No tracking info found for this thread';
              }

              gmail.tools.add_modal_window(
                'Tracking information',
                modalContents,
                () => {
                  gmail.tools.remove_modal_window();
                }
              );
            }
          } catch (e) {
            console.log(e);
          }
        }
      },
      btnInfoClass
    );
    fetchAuth(`${infoUrl}?threadId=${thread_id}`).then(async (resp) => {
      if (resp.ok) {
        const data = await resp.json();
        const { views } = data;
        const trackingStats = views != null ? views.length : 'n/a';

        toolbar_button.children().text(`Tracking (${trackingStats})`);
      }
    });
  }

  function setupTrackerToolbarForNotEmail() {
    gmail.tools.add_toolbar_button(
      'Tracking',
      async () => {
        const resp = await fetchAuth(`${dashboardUrl}?userId=${sub}`);
        if (resp.ok) {
          const data = await resp.json();

          const listContents = data.views
            .slice(0, 10)
            .map(
              (x: any) =>
                `<li>${dayjs(x.createdAt).format('L LT')} (${
                  x.tracker.emailSubject || x.tracker.threadId
                })</li>`
            );

          gmail.tools.add_modal_window(
            'Tracking information',
            `<ol>${listContents.join('')}</ol>`,
            () => {
              gmail.tools.remove_modal_window();
            }
          );
        }
      },
      btnInfoClass
    );
  }

  function setupLoginToolbar() {
    const loginBtn = gmail.tools.add_toolbar_button(
      'Login',
      // pending here
      async () => {
        loginBtn.children().text('Requesting...');
        await fetch(loginUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({ email: userEmail }),
        });
        loginBtn.children().text('Requested');
      },
      btnInfoClass
    );
  }

  setInterval(function () {
    if (jQuery(`[gh="mtb"] .${btnInfoClass}`).length === 0) {
      if (gmail.check.is_inside_email()) {
        if (isLoggedIn()) {
          setupTrackerToolbarForEmail();
        } else {
          setupLoginToolbar();
        }
      } else {
        if (isLoggedIn()) {
          setupTrackerToolbarForNotEmail();
        } else {
          setupLoginToolbar();
        }
      }
    }
  }, 500);

  chrome.runtime.sendMessage(
    extensionId,
    { your: 'STORAGE', emailAccount: userEmail },
    function (response: any) {
      // handle the response
      accessToken = response.accessToken;
      expiresAt = response.expiresAt;

      const claims = decodeJwt(accessToken);
      sub = claims.sub ?? null;

      console.log('Received log in info', response, sub);
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

      const expectedPrefix = `${imageUrl}?trackId=`;

      const urls = Array.from(trackers)
        .map((el) => (el instanceof HTMLElement ? el.dataset.src : null))
        .filter((src) => !!src && src.startsWith(expectedPrefix)) as string[];

      // console.log(
      //   Array.from(trackers).map((el) =>
      //     el instanceof HTMLImageElement ? el.dataset.src : null
      //   )
      // );

      const trackIds = urls.map((src) => src.slice(expectedPrefix.length));

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
      const url = `${imageUrl}?trackId=${trackId}`;

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
