import { Logger } from 'simple-logging-system';
import { genericError, HttpResponse, toErrorResponsePromise } from './HttpResponse';
import fetchClient, { FetchResponseHandler } from './FetchClient';
import HttpRequest from '../../simple-http-request-builder/HttpRequest';
import validateBasicStatusCodes from './FetchStatusValidators';

const logger = new Logger('JsonFetchClient');

/**
 * A {@link FetchResponseHandler} that verify the content type of a {@link Response}
 * using the `content-type` response HTTP header.
 *
 * By default the `application/json` is looked for.
 * @param response The {@link Response} to validate
 * @param jsonContentType The content type to look for in `content-type` response HTTP header.
 * Note that the `jsonContentType` can be a partial type. For example if `jsonContentType = 'json'`,
 * then a response with the header `application/vnd.myapp.type.v1+json` will be valid.
 */
export const jsonContentTypeValidator: FetchResponseHandler = (
  response: Response,
  jsonContentType: string = 'application/json',
) => {
  // make sure the response is a JSON one
  const contentType = response.headers.get('content-type');
  if (contentType === null || contentType.indexOf(jsonContentType) === -1) {
    logger.error('Response type is not JSON', response);
    return toErrorResponsePromise(genericError);
  }

  return undefined;
};

/**
 * A mapper that will handle non-successful HTTP responses that have however a JSON body.
 *
 * This mapper generally returns an {@link HttpResponse#error} containing the matching `errorCode`.
 * But if necessary it can return a {@link HttpResponse#response}.
 *
 * See the default implementation: {@link defaultJsonErrorMapper}.
 *
 * @param response The non-successful HTTP {@link Response}
 * @param json The parsed JSON object
 */
// any is the returned type of the Fetch.json() Promise
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonErrorMapper = (response: Response, json: any) => HttpResponse<unknown>;

/**
 * The default {@link JsonErrorMapper} implementation that returns an {@link HttpResponse#error} containing:
 * - The HTTP response body JSON object if it contains a {@link HttpError#errorCode} attribute
 * - Else a {@link genericError}
 */
export const defaultJsonErrorMapper: JsonErrorMapper = (response: Response, json) => {
  if (typeof json.errorCode === 'undefined') {
    logger.error('Unrecognized JSON error', response);
    return { error: genericError };
  }
  return { error: json };
};

/**
 * A {@link FetchResponseHandler} that tries to convert the {@link Response} JSON body
 * to an {@link HttpResponse}:
 * - If the {@link Response} body is not a valid JSON object,
 * {@link HttpResponse#error} will contain a {@link genericError}
 * - If the HTTP response is successful (status code is 2xx),
 * {@link HttpResponse#response} will contain the JSON parsed object
 * - If the HTTP response is not successful (status code is not 2xx),
 * the {@link JsonErrorMapper} will be executed to return a {@link HttpResponse}
 *
 * @param response The {@link Response} to parse
 * @param jsonErrorMapper The {@link JsonErrorMapper} that will handle the parsed JSON object in case
 * the HTTP response is not successful (status code is not 2xx)
 */
export const toJsonResponse: FetchResponseHandler = (
  response: Response,
  jsonErrorMapper: JsonErrorMapper = defaultJsonErrorMapper,
) => response
  .json()
  .then((json) => {
    if (response.ok) {
      return {
        response: json,
      };
    }
    return jsonErrorMapper(response, json);
  })
  .catch((error) => {
    logger.error('Cannot parse JSON', error);
    return {
      error: genericError,
    };
  });

/**
 * A {@link HttpClient} that executes an {@link HttpRequest} that returns JSON responses.
 * It uses {@link fetchClient} to executes the {@link HttpRequest}, and then it uses the following handlers:
 * 1. {@link validateBasicStatusCodes}
 * 2. {@link jsonContentTypeValidator}
 * 3. {@link toJsonResponse}
 */
const defaultJsonFetchClient = <T>(httpRequest: HttpRequest<unknown>)
  : Promise<HttpResponse<T>> => fetchClient(
    httpRequest, validateBasicStatusCodes, jsonContentTypeValidator, toJsonResponse,
  );

export default defaultJsonFetchClient;
