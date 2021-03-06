import { green } from 'colors/safe';
import isEmpty from 'lodash.isempty';
import { SharedIniFileCredentials, Credentials } from 'aws-sdk';
import { CredentialProviderSource, Mode } from 'aws-cdk';

import { tokenCodeFn } from './utils';
import { ProfileCredentialsCache } from './profile-credentials-cache';

const profileCredentialsCache = new ProfileCredentialsCache();

export class IniFileCredentialProviderSource
  implements CredentialProviderSource {
  constructor(
    public readonly name: string,
    private readonly profiles: { [key: string]: string },
    private readonly filename: string
  ) {}

  public canProvideCredentials(accountId: string): Promise<boolean> {
    return Promise.resolve(
      Object.prototype.hasOwnProperty.call(this.profiles, accountId)
    );
  }

  public getProvider(accountId: string, mode: Mode): Promise<Credentials> {
    const profile = this.profiles[accountId];

    console.log('\n');
    console.log(
      ` 🚀  Using profile ${green(profile)} for account ${green(
        accountId
      )} in mode ${green(Mode[mode])}`
    );
    console.log('\n');

    let credentials = profileCredentialsCache.get(profile);

    if (!credentials) {
      credentials = new SharedIniFileCredentials({
        tokenCodeFn,
        filename: this.filename,
        profile
      });

      profileCredentialsCache.set(profile, credentials);
    }

    return Promise.resolve(credentials);
  }

  public isAvailable(): Promise<boolean> {
    if (this.filename && !isEmpty(this.profiles)) return Promise.resolve(true);

    return Promise.resolve(false);
  }
}
